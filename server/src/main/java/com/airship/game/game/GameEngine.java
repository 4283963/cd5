package com.airship.game.game;

import io.netty.channel.Channel;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class GameEngine {

    private static GameEngine instance;
    private Map<String, GameRoom> rooms = new ConcurrentHashMap<>();
    private Map<String, String> playerRoomMap = new ConcurrentHashMap<>();
    private static final String DEFAULT_ROOM = "lobby";

    private GameEngine() {
        createRoom(DEFAULT_ROOM);
    }

    public static synchronized GameEngine getInstance() {
        if (instance == null) {
            instance = new GameEngine();
        }
        return instance;
    }

    public GameRoom createRoom(String roomId) {
        GameRoom room = new GameRoom(roomId);
        rooms.put(roomId, room);
        room.start();
        System.out.println("[GameEngine] Created room: " + roomId);
        return room;
    }

    public GameRoom getRoom(String roomId) {
        return rooms.get(roomId);
    }

    public GameRoom getDefaultRoom() {
        return rooms.get(DEFAULT_ROOM);
    }

    public GameRoom getOrCreateRoom(String roomId) {
        GameRoom room = rooms.get(roomId);
        if (room == null) {
            room = createRoom(roomId);
        }
        return room;
    }

    public Player addPlayerToDefaultRoom(String playerId, String playerName, Channel channel) {
        GameRoom room = getDefaultRoom();
        Player player = room.addPlayer(playerId, playerName, channel);
        if (player != null) {
            playerRoomMap.put(playerId, DEFAULT_ROOM);
        }
        return player;
    }

    public void removePlayer(String playerId) {
        String roomId = playerRoomMap.remove(playerId);
        if (roomId != null) {
            GameRoom room = rooms.get(roomId);
            if (room != null) {
                room.removePlayer(playerId);
            }
        }
    }

    public GameRoom getPlayerRoom(String playerId) {
        String roomId = playerRoomMap.get(playerId);
        if (roomId != null) {
            return rooms.get(roomId);
        }
        return null;
    }

    public void handleInput(String playerId, float dx, float dy, boolean shooting, boolean boosting) {
        GameRoom room = getPlayerRoom(playerId);
        if (room != null) {
            room.handleInput(playerId, dx, dy, shooting, boosting);
        }
    }

    public void handleShoot(String playerId) {
        GameRoom room = getPlayerRoom(playerId);
        if (room != null) {
            room.handleShoot(playerId);
        }
    }

    public void handleRespawn(String playerId) {
        GameRoom room = getPlayerRoom(playerId);
        if (room != null) {
            room.handleRespawn(playerId);
        }
    }

    public void handlePing(String playerId) {
        GameRoom room = getPlayerRoom(playerId);
        if (room != null) {
            room.handlePing(playerId);
        }
    }

    public int getTotalPlayers() {
        return playerRoomMap.size();
    }

    public void shutdown() {
        for (GameRoom room : rooms.values()) {
            room.stop();
        }
        rooms.clear();
        playerRoomMap.clear();
        System.out.println("[GameEngine] Shutdown complete");
    }
}
