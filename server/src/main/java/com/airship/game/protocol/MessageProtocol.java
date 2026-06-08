package com.airship.game.protocol;

import com.google.gson.Gson;
import com.google.gson.JsonObject;

public class MessageProtocol {

    public static final String TYPE_WELCOME = "welcome";
    public static final String TYPE_PLAYER_JOINED = "playerJoined";
    public static final String TYPE_PLAYER_LEFT = "playerLeft";
    public static final String TYPE_GAME_STATE = "gameState";
    public static final String TYPE_BULLET_FIRED = "bulletFired";
    public static final String TYPE_BULLET_CONFIRM = "bulletConfirm";
    public static final String TYPE_PLAYER_HIT = "playerHit";
    public static final String TYPE_PLAYER_KILLED = "playerKilled";
    public static final String TYPE_LEADERBOARD = "leaderboard";
    public static final String TYPE_PING = "ping";
    public static final String TYPE_PONG = "pong";
    public static final String TYPE_INPUT = "input";
    public static final String TYPE_SHOOT = "shoot";
    public static final String TYPE_JOIN = "join";
    public static final String TYPE_RESPAWN = "respawn";
    public static final String TYPE_TIME_SYNC = "timeSync";

    private static final Gson gson = new Gson();

    public static JsonObject parse(String json) {
        return gson.fromJson(json, JsonObject.class);
    }

    public static String toJson(Object obj) {
        return gson.toJson(obj);
    }

    public static String createWelcome(String playerId, String playerName, long serverTime) {
        JsonObject msg = new JsonObject();
        msg.addProperty("type", TYPE_WELCOME);
        msg.addProperty("playerId", playerId);
        msg.addProperty("playerName", playerName);
        msg.addProperty("serverTime", serverTime);
        msg.addProperty("tickRate", 60);
        return msg.toString();
    }

    public static String createTimeSync(long serverTime, int sequence) {
        JsonObject msg = new JsonObject();
        msg.addProperty("type", TYPE_TIME_SYNC);
        msg.addProperty("serverTime", serverTime);
        msg.addProperty("sequence", sequence);
        return msg.toString();
    }

    public static String createBulletConfirm(String localBulletId, String serverBulletId,
                                             float x, float y, long serverTime) {
        JsonObject msg = new JsonObject();
        msg.addProperty("type", TYPE_BULLET_CONFIRM);
        msg.addProperty("localBulletId", localBulletId);
        msg.addProperty("serverBulletId", serverBulletId);
        msg.addProperty("x", x);
        msg.addProperty("y", y);
        msg.addProperty("serverTime", serverTime);
        return msg.toString();
    }

    public static String createPlayerJoined(String playerId, String playerName, int score) {
        JsonObject msg = new JsonObject();
        msg.addProperty("type", TYPE_PLAYER_JOINED);
        msg.addProperty("playerId", playerId);
        msg.addProperty("name", playerName);
        msg.addProperty("score", score);
        return msg.toString();
    }

    public static String createPlayerLeft(String playerId, String playerName) {
        JsonObject msg = new JsonObject();
        msg.addProperty("type", TYPE_PLAYER_LEFT);
        msg.addProperty("playerId", playerId);
        msg.addProperty("name", playerName);
        return msg.toString();
    }

    public static String createPong() {
        JsonObject msg = new JsonObject();
        msg.addProperty("type", TYPE_PONG);
        return msg.toString();
    }

    public static String createPlayerHit(String playerId, int hp, String shooterId, int damage) {
        JsonObject msg = new JsonObject();
        msg.addProperty("type", TYPE_PLAYER_HIT);
        msg.addProperty("playerId", playerId);
        msg.addProperty("hp", hp);
        msg.addProperty("shooterId", shooterId);
        msg.addProperty("damage", damage);
        return msg.toString();
    }

    public static String createPlayerKilled(String victimId, String victimName, int victimDeaths,
                                            String killerId, String killerName, int killerKills, int killerScore) {
        JsonObject msg = new JsonObject();
        msg.addProperty("type", TYPE_PLAYER_KILLED);
        msg.addProperty("victimId", victimId);
        msg.addProperty("victimName", victimName);
        msg.addProperty("victimDeaths", victimDeaths);
        msg.addProperty("killerId", killerId);
        msg.addProperty("killerName", killerName);
        msg.addProperty("killerKills", killerKills);
        msg.addProperty("killerScore", killerScore);
        return msg.toString();
    }
}
