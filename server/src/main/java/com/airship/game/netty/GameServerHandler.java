package com.airship.game.netty;

import com.airship.game.game.GameEngine;
import com.airship.game.protocol.MessageProtocol;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketFrame;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class GameServerHandler extends SimpleChannelInboundHandler<WebSocketFrame> {

    private static final Map<String, ChannelHandlerContext> connections = new ConcurrentHashMap<>();
    private static final Map<ChannelHandlerContext, String> playerIds = new ConcurrentHashMap<>();

    private GameEngine gameEngine;

    public GameServerHandler() {
        this.gameEngine = GameEngine.getInstance();
    }

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, WebSocketFrame frame) {
        if (frame instanceof TextWebSocketFrame) {
            String request = ((TextWebSocketFrame) frame).text();
            handleMessage(ctx, request);
        }
    }

    private void handleMessage(ChannelHandlerContext ctx, String message) {
        try {
            JsonObject data = JsonParser.parseString(message).getAsJsonObject();
            String type = data.get("type").getAsString();

            switch (type) {
                case MessageProtocol.TYPE_JOIN:
                    handleJoin(ctx, data);
                    break;
                case MessageProtocol.TYPE_INPUT:
                    handleInput(ctx, data);
                    break;
                case MessageProtocol.TYPE_SHOOT:
                    handleShoot(ctx);
                    break;
                case MessageProtocol.TYPE_RESPAWN:
                    handleRespawn(ctx);
                    break;
                case MessageProtocol.TYPE_PING:
                    handlePing(ctx);
                    break;
                default:
                    System.out.println("[GameServerHandler] Unknown message type: " + type);
            }
        } catch (Exception e) {
            System.err.println("[GameServerHandler] Error handling message: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void handleJoin(ChannelHandlerContext ctx, JsonObject data) {
        String playerName = data.has("name") ? data.get("name").getAsString() : "Player";
        
        String playerId = "player_" + UUID.randomUUID().toString().substring(0, 8);
        
        playerIds.put(ctx, playerId);
        connections.put(playerId, ctx);

        gameEngine.addPlayerToDefaultRoom(playerId, playerName, ctx.channel());
        
        System.out.println("[GameServerHandler] Player joined: " + playerName + " (" + playerId + ")");
        System.out.println("[GameServerHandler] Total players: " + gameEngine.getTotalPlayers());
    }

    private void handleInput(ChannelHandlerContext ctx, JsonObject data) {
        String playerId = playerIds.get(ctx);
        if (playerId == null) return;

        float dx = data.has("dx") ? data.get("dx").getAsFloat() : 0;
        float dy = data.has("dy") ? data.get("dy").getAsFloat() : 0;
        boolean shooting = data.has("shooting") && data.get("shooting").getAsBoolean();
        boolean boosting = data.has("boosting") && data.get("boosting").getAsBoolean();

        gameEngine.handleInput(playerId, dx, dy, shooting, boosting);
    }

    private void handleShoot(ChannelHandlerContext ctx) {
        String playerId = playerIds.get(ctx);
        if (playerId == null) return;

        gameEngine.handleShoot(playerId);
    }

    private void handleRespawn(ChannelHandlerContext ctx) {
        String playerId = playerIds.get(ctx);
        if (playerId == null) return;

        gameEngine.handleRespawn(playerId);
    }

    private void handlePing(ChannelHandlerContext ctx) {
        String playerId = playerIds.get(ctx);
        if (playerId == null) return;

        gameEngine.handlePing(playerId);
    }

    @Override
    public void channelActive(ChannelHandlerContext ctx) {
        System.out.println("[GameServerHandler] New connection: " + ctx.channel().remoteAddress());
    }

    @Override
    public void channelInactive(ChannelHandlerContext ctx) {
        String playerId = playerIds.remove(ctx);
        if (playerId != null) {
            connections.remove(playerId);
            gameEngine.removePlayer(playerId);
            System.out.println("[GameServerHandler] Player disconnected: " + playerId);
            System.out.println("[GameServerHandler] Total players: " + gameEngine.getTotalPlayers());
        }
        ctx.close();
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        System.err.println("[GameServerHandler] Exception: " + cause.getMessage());
        ctx.close();
    }

    public static int getConnectionCount() {
        return connections.size();
    }
}
