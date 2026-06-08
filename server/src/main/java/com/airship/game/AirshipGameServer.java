package com.airship.game;

import com.airship.game.db.DatabaseManager;
import com.airship.game.game.GameEngine;
import com.airship.game.netty.WebSocketServer;

public class AirshipGameServer {

    private static final int DEFAULT_PORT = 8080;

    public static void main(String[] args) {
        int port = DEFAULT_PORT;

        if (args.length > 0) {
            try {
                port = Integer.parseInt(args[0]);
            } catch (NumberFormatException e) {
                System.out.println("Invalid port number, using default: " + DEFAULT_PORT);
            }
        }

        System.out.println("========================================");
        System.out.println("  AIRSHIP BATTLE GAME SERVER");
        System.out.println("  Netty WebSocket Multiplayer Server");
        System.out.println("========================================");
        System.out.println();

        DatabaseManager db = DatabaseManager.getInstance();
        db.connect();

        GameEngine gameEngine = GameEngine.getInstance();

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("\n[Server] Shutting down...");
            gameEngine.shutdown();
            db.close();
            System.out.println("[Server] Goodbye!");
        }));

        try {
            WebSocketServer server = new WebSocketServer(port);
            System.out.println("[Server] Starting on port " + port + "...");
            System.out.println("[Server] Open client/index.html in your browser to play!");
            System.out.println();
            server.start();
        } catch (InterruptedException e) {
            System.err.println("[Server] Server interrupted: " + e.getMessage());
            Thread.currentThread().interrupt();
        }
    }
}
