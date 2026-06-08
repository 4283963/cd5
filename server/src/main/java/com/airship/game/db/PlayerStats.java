package com.airship.game.db;

public class PlayerStats {

    private String playerName;
    private int kills;
    private int deaths;
    private int totalScore;
    private int gamesPlayed;
    private int wins;

    public PlayerStats(String playerName, int kills, int deaths, int totalScore, int gamesPlayed, int wins) {
        this.playerName = playerName;
        this.kills = kills;
        this.deaths = deaths;
        this.totalScore = totalScore;
        this.gamesPlayed = gamesPlayed;
        this.wins = wins;
    }

    public String getPlayerName() {
        return playerName;
    }

    public void setPlayerName(String playerName) {
        this.playerName = playerName;
    }

    public int getKills() {
        return kills;
    }

    public void setKills(int kills) {
        this.kills = kills;
    }

    public int getDeaths() {
        return deaths;
    }

    public void setDeaths(int deaths) {
        this.deaths = deaths;
    }

    public int getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(int totalScore) {
        this.totalScore = totalScore;
    }

    public int getGamesPlayed() {
        return gamesPlayed;
    }

    public void setGamesPlayed(int gamesPlayed) {
        this.gamesPlayed = gamesPlayed;
    }

    public int getWins() {
        return wins;
    }

    public void setWins(int wins) {
        this.wins = wins;
    }

    public double getWinRate() {
        if (gamesPlayed == 0) return 0.0;
        return (double) wins / gamesPlayed * 100;
    }

    public double getKDR() {
        if (deaths == 0) return kills;
        return (double) kills / deaths;
    }
}
