package com.airship.game.db;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class DatabaseManager {

    private static DatabaseManager instance;
    private HikariDataSource dataSource;
    private boolean enabled = false;

    private static final String DB_HOST = "localhost";
    private static final int DB_PORT = 3306;
    private static final String DB_NAME = "airship_game";
    private static final String DB_USER = "root";
    private static final String DB_PASSWORD = "password";

    private DatabaseManager() {
    }

    public static synchronized DatabaseManager getInstance() {
        if (instance == null) {
            instance = new DatabaseManager();
        }
        return instance;
    }

    public void connect() {
        try {
            HikariConfig config = new HikariConfig();
            config.setJdbcUrl("jdbc:mysql://" + DB_HOST + ":" + DB_PORT + "/" + DB_NAME 
                    + "?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true");
            config.setUsername(DB_USER);
            config.setPassword(DB_PASSWORD);
            config.setMaximumPoolSize(10);
            config.setMinimumIdle(2);
            config.setIdleTimeout(30000);
            config.setConnectionTimeout(10000);

            dataSource = new HikariDataSource(config);
            enabled = true;
            System.out.println("[Database] Connected to MySQL: " + DB_NAME);
            initTables();
        } catch (Exception e) {
            System.err.println("[Database] Failed to connect: " + e.getMessage());
            System.err.println("[Database] Running without database persistence...");
            enabled = false;
        }
    }

    private void initTables() {
        if (!enabled) return;

        String createTableSQL = "CREATE TABLE IF NOT EXISTS player_stats (" +
                "id INT AUTO_INCREMENT PRIMARY KEY," +
                "player_name VARCHAR(50) NOT NULL UNIQUE," +
                "kills INT DEFAULT 0," +
                "deaths INT DEFAULT 0," +
                "total_score INT DEFAULT 0," +
                "games_played INT DEFAULT 0," +
                "wins INT DEFAULT 0," +
                "last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute(createTableSQL);
            System.out.println("[Database] Table 'player_stats' ready");
        } catch (SQLException e) {
            System.err.println("[Database] Failed to create table: " + e.getMessage());
        }
    }

    public Connection getConnection() throws SQLException {
        if (!enabled) {
            throw new SQLException("Database is not enabled");
        }
        return dataSource.getConnection();
    }

    public void savePlayerStats(String playerName, int kills, int deaths, int score, boolean won) {
        if (!enabled) return;

        String sql = "INSERT INTO player_stats (player_name, kills, deaths, total_score, games_played, wins) " +
                "VALUES (?, ?, ?, ?, 1, ?) " +
                "ON DUPLICATE KEY UPDATE " +
                "kills = kills + ?, " +
                "deaths = deaths + ?, " +
                "total_score = total_score + ?, " +
                "games_played = games_played + 1, " +
                "wins = wins + ?, " +
                "last_played = CURRENT_TIMESTAMP";

        try (Connection conn = getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, playerName);
            pstmt.setInt(2, kills);
            pstmt.setInt(3, deaths);
            pstmt.setInt(4, score);
            pstmt.setInt(5, won ? 1 : 0);
            pstmt.setInt(6, kills);
            pstmt.setInt(7, deaths);
            pstmt.setInt(8, score);
            pstmt.setInt(9, won ? 1 : 0);
            pstmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("[Database] Failed to save stats: " + e.getMessage());
        }
    }

    public PlayerStats getPlayerStats(String playerName) {
        if (!enabled) return null;

        String sql = "SELECT * FROM player_stats WHERE player_name = ?";

        try (Connection conn = getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, playerName);
            ResultSet rs = pstmt.executeQuery();
            if (rs.next()) {
                return new PlayerStats(
                        rs.getString("player_name"),
                        rs.getInt("kills"),
                        rs.getInt("deaths"),
                        rs.getInt("total_score"),
                        rs.getInt("games_played"),
                        rs.getInt("wins")
                );
            }
        } catch (SQLException e) {
            System.err.println("[Database] Failed to get stats: " + e.getMessage());
        }
        return null;
    }

    public List<PlayerStats> getTopPlayers(int limit) {
        List<PlayerStats> players = new ArrayList<>();
        if (!enabled) return players;

        String sql = "SELECT * FROM player_stats ORDER BY total_score DESC LIMIT ?";

        try (Connection conn = getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, limit);
            ResultSet rs = pstmt.executeQuery();
            while (rs.next()) {
                players.add(new PlayerStats(
                        rs.getString("player_name"),
                        rs.getInt("kills"),
                        rs.getInt("deaths"),
                        rs.getInt("total_score"),
                        rs.getInt("games_played"),
                        rs.getInt("wins")
                ));
            }
        } catch (SQLException e) {
            System.err.println("[Database] Failed to get top players: " + e.getMessage());
        }
        return players;
    }

    public double getWinRate(String playerName) {
        PlayerStats stats = getPlayerStats(playerName);
        if (stats == null || stats.getGamesPlayed() == 0) return 0.0;
        return (double) stats.getWins() / stats.getGamesPlayed() * 100;
    }

    public void close() {
        if (dataSource != null && !dataSource.isClosed()) {
            dataSource.close();
            System.out.println("[Database] Connection closed");
        }
    }

    public boolean isEnabled() {
        return enabled;
    }
}
