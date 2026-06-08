package com.airship.game.game;

import com.airship.game.db.DatabaseManager;
import com.airship.game.protocol.MessageProtocol;
import io.netty.channel.Channel;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class GameRoom {

    private String roomId;
    private Map<String, Player> players = new ConcurrentHashMap<>();
    private Map<String, Channel> playerChannels = new ConcurrentHashMap<>();
    private List<Bullet> bullets = new ArrayList<>();
    private ScheduledExecutorService gameLoop;
    private ScheduledExecutorService stateBroadcaster;
    private volatile boolean running = false;
    private int maxPlayers = 8;
    private float tickRate = 60;
    private float broadcastRate = 30;

    private DatabaseManager db;

    public GameRoom(String roomId) {
        this.roomId = roomId;
        this.db = DatabaseManager.getInstance();
    }

    public synchronized void start() {
        if (running) return;
        running = true;

        gameLoop = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "GameRoom-" + roomId + "-Loop");
            t.setDaemon(true);
            return t;
        });

        stateBroadcaster = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "GameRoom-" + roomId + "-Broadcast");
            t.setDaemon(true);
            return t;
        });

        float tickInterval = 1000f / tickRate;
        gameLoop.scheduleAtFixedRate(
                this::gameTick,
                0,
                (long) tickInterval * 1000,
                TimeUnit.MICROSECONDS
        );

        float broadcastInterval = 1000f / broadcastRate;
        stateBroadcaster.scheduleAtFixedRate(
                this::broadcastGameState,
                0,
                (long) broadcastInterval * 1000,
                TimeUnit.MICROSECONDS
        );

        System.out.println("[GameRoom] " + roomId + " started");
    }

    public synchronized void stop() {
        running = false;
        if (gameLoop != null) gameLoop.shutdown();
        if (stateBroadcaster != null) stateBroadcaster.shutdown();
        System.out.println("[GameRoom] " + roomId + " stopped");
    }

    private long lastTickTime = System.nanoTime();

    private void gameTick() {
        long now = System.nanoTime();
        float deltaTime = (now - lastTickTime) / 1_000_000_000.0f;
        lastTickTime = now;

        deltaTime = Math.min(deltaTime, 0.1f);

        for (Player player : players.values()) {
            player.update(deltaTime);

            if (player.isShooting() && player.canShoot()) {
                Bullet bullet = player.shoot();
                if (bullet != null) {
                    synchronized (bullets) {
                        bullets.add(bullet);
                    }
                    broadcastBulletFired(bullet);
                }
            }
        }

        synchronized (bullets) {
            for (Bullet bullet : bullets) {
                bullet.update(deltaTime);
            }
            bullets.removeIf(b -> !b.isActive());
        }

        checkCollisions();
    }

    private void checkCollisions() {
        synchronized (bullets) {
            for (Bullet bullet : bullets) {
                if (!bullet.isActive()) continue;

                for (Player player : players.values()) {
                    if (!player.isActive()) continue;

                    if (bullet.checkCollision(player)) {
                        boolean died = player.takeDamage(bullet.getDamage(), bullet.getOwnerId());
                        bullet.setActive(false);

                        Player shooter = players.get(bullet.getOwnerId());

                        broadcastPlayerHit(player, bullet.getOwnerId(), bullet.getDamage());

                        if (died) {
                            if (shooter != null) {
                                shooter.addKill();
                            }
                            broadcastPlayerKilled(player, shooter);
                        }
                        break;
                    }
                }
            }
        }
    }

    public Player addPlayer(String playerId, String playerName, Channel channel) {
        if (players.size() >= maxPlayers) {
            return null;
        }

        Player player = new Player(playerId, playerName);
        player.setRandomSpawn();
        players.put(playerId, player);
        playerChannels.put(playerId, channel);

        System.out.println("[GameRoom] " + roomId + " Player joined: " + playerName + " (" + playerId + ")");

        broadcast(MessageProtocol.createPlayerJoined(playerId, playerName, player.getScore()));

        sendToPlayer(playerId, MessageProtocol.createWelcome(playerId, playerName, System.currentTimeMillis()));

        return player;
    }

    public void removePlayer(String playerId) {
        Player player = players.remove(playerId);
        playerChannels.remove(playerId);

        if (player != null) {
            System.out.println("[GameRoom] " + roomId + " Player left: " + player.getName() + " (" + playerId + ")");

            if (db.isEnabled()) {
                boolean won = player.getKills() > player.getDeaths();
                db.savePlayerStats(player.getName(), player.getKills(), player.getDeaths(),
                        player.getScore(), won);
            }

            broadcast(MessageProtocol.createPlayerLeft(playerId, player.getName()));
        }
    }

    public void handleInput(String playerId, float dx, float dy, boolean shooting, boolean boosting) {
        Player player = players.get(playerId);
        if (player != null) {
            player.setInputDx(dx);
            player.setInputDy(dy);
            player.setShooting(shooting);
            player.setBoosting(boosting);
        }
    }

    public void handleShoot(String playerId) {
        handleShoot(playerId, null);
    }

    public void handleShoot(String playerId, String localBulletId) {
        Player player = players.get(playerId);
        if (player != null && player.canShoot() && player.isActive()) {
            Bullet bullet = player.shoot();
            if (bullet != null) {
                synchronized (bullets) {
                    bullets.add(bullet);
                }
                broadcastBulletFired(bullet);

                if (localBulletId != null && !localBulletId.isEmpty()) {
                    sendToPlayer(playerId, MessageProtocol.createBulletConfirm(
                            localBulletId, bullet.getId(),
                            bullet.getX(), bullet.getY(),
                            System.currentTimeMillis()
                    ));
                }
            }
        }
    }

    public void handleRespawn(String playerId) {
        Player player = players.get(playerId);
        if (player != null && !player.isActive()) {
            player.respawn();
        }
    }

    private void broadcastGameState() {
        if (players.isEmpty()) return;

        long serverTime = System.currentTimeMillis();
        List<Player> playerList = new ArrayList<>(players.values());
        List<Bullet> bulletSnapshot;
        synchronized (bullets) {
            bulletSnapshot = new ArrayList<>(bullets);
        }
        
        StringBuilder sb = new StringBuilder();
        sb.append("{\"type\":\"gameState\",\"serverTime\":").append(serverTime);
        sb.append(",\"players\":[");
        
        for (int i = 0; i < playerList.size(); i++) {
            Player p = playerList.get(i);
            if (i > 0) sb.append(",");
            sb.append(String.format(
                    "{\"id\":\"%s\",\"name\":\"%s\",\"x\":%.2f,\"y\":%.2f,\"vx\":%.2f,\"vy\":%.2f," +
                            "\"color\":\"%s\",\"hp\":%d,\"maxHp\":%d,\"score\":%d,\"kills\":%d,\"deaths\":%d," +
                            "\"active\":%b,\"facing\":%d,\"invincible\":%b}",
                    p.getId(), escapeJson(p.getName()),
                    p.getX(), p.getY(), p.getVx(), p.getVy(),
                    p.getColor(), p.getHp(), p.getMaxHp(),
                    p.getScore(), p.getKills(), p.getDeaths(),
                    p.isActive(), p.getFacing(), p.isInvincible()
            ));
        }
        
        sb.append("],\"bullets\":[");
        
        for (int i = 0; i < bulletSnapshot.size(); i++) {
            Bullet b = bulletSnapshot.get(i);
            if (i > 0) sb.append(",");
            sb.append(String.format(
                    "{\"id\":\"%s\",\"x\":%.2f,\"y\":%.2f,\"vx\":%.2f,\"vy\":%.2f," +
                            "\"ownerId\":\"%s\",\"damage\":%d,\"color\":\"%s\",\"radius\":%.1f}",
                    b.getId(), b.getX(), b.getY(), b.getVx(), b.getVy(),
                    b.getOwnerId(), b.getDamage(), b.getColor(), b.getRadius()
            ));
        }
        
        sb.append("]}");

        broadcast(sb.toString());

        if (System.currentTimeMillis() % 3000 < 100) {
            broadcastLeaderboard();
        }
    }

    private void broadcastLeaderboard() {
        List<Player> playerList = new ArrayList<>(players.values());
        playerList.sort((a, b) -> Integer.compare(b.getScore(), a.getScore()));

        StringBuilder sb = new StringBuilder();
        sb.append("{\"type\":\"leaderboard\",\"players\":[");

        for (int i = 0; i < Math.min(playerList.size(), 10); i++) {
            Player p = playerList.get(i);
            if (i > 0) sb.append(",");
            sb.append(String.format(
                    "{\"name\":\"%s\",\"score\":%d,\"kills\":%d,\"deaths\":%d}",
                    escapeJson(p.getName()), p.getScore(), p.getKills(), p.getDeaths()
            ));
        }

        sb.append("]}");
        broadcast(sb.toString());
    }

    private void broadcastBulletFired(Bullet bullet) {
        long serverTime = System.currentTimeMillis();
        String msg = String.format(
                "{\"type\":\"bulletFired\",\"serverTime\":%d,\"bullet\":{\"id\":\"%s\",\"x\":%.2f,\"y\":%.2f,\"vx\":%.2f,\"vy\":%.2f," +
                        "\"ownerId\":\"%s\",\"damage\":%d,\"color\":\"%s\",\"radius\":%.1f}}",
                serverTime, bullet.getId(),
                bullet.getX(), bullet.getY(), bullet.getVx(), bullet.getVy(),
                bullet.getOwnerId(), bullet.getDamage(), bullet.getColor(), bullet.getRadius()
        );
        broadcast(msg);
    }

    private void broadcastPlayerHit(Player player, String shooterId, int damage) {
        String msg = MessageProtocol.createPlayerHit(
                player.getId(), player.getHp(), shooterId, damage
        );
        broadcast(msg);
    }

    private void broadcastPlayerKilled(Player victim, Player killer) {
        String killerId = killer != null ? killer.getId() : "";
        String killerName = killer != null ? killer.getName() : "";
        int killerKills = killer != null ? killer.getKills() : 0;
        int killerScore = killer != null ? killer.getScore() : 0;

        String msg = MessageProtocol.createPlayerKilled(
                victim.getId(), victim.getName(), victim.getDeaths(),
                killerId, killerName, killerKills, killerScore
        );
        broadcast(msg);
    }

    private void broadcast(String message) {
        for (Channel channel : playerChannels.values()) {
            if (channel.isActive()) {
                channel.writeAndFlush(new TextWebSocketFrame(message));
            }
        }
    }

    private void sendToPlayer(String playerId, String message) {
        Channel channel = playerChannels.get(playerId);
        if (channel != null && channel.isActive()) {
            channel.writeAndFlush(new TextWebSocketFrame(message));
        }
    }

    public void handlePing(String playerId) {
        sendToPlayer(playerId, MessageProtocol.createPong());
    }

    private String escapeJson(String s) {
        return s.replace("\"", "\\\"").replace("\\", "\\\\");
    }

    public int getPlayerCount() {
        return players.size();
    }

    public String getRoomId() {
        return roomId;
    }

    public boolean isEmpty() {
        return players.isEmpty();
    }
}
