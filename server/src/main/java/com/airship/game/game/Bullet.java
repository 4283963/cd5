package com.airship.game.game;

public class Bullet {

    private String id;
    private volatile float x;
    private volatile float y;
    private float vx;
    private float vy;
    private String ownerId;
    private int damage;
    private String color;
    private float radius = 4;
    private boolean active = true;
    private long age = 0;
    private long maxAge = 2000;

    private static int bulletCounter = 0;

    public Bullet(float x, float y, float vx, float vy, String ownerId, int damage, String color) {
        this.id = "bullet_" + (++bulletCounter);
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.ownerId = ownerId;
        this.damage = damage;
        this.color = color;
    }

    public void update(float deltaTime) {
        x += vx * deltaTime;
        y += vy * deltaTime;
        age += deltaTime * 1000;

        if (age >= maxAge) {
            active = false;
        }

        if (x < -20 || x > 980 || y < -20 || y > 660) {
            active = false;
        }
    }

    public boolean checkCollision(Player player) {
        if (!active || player == null || !player.isActive()) return false;
        if (player.getId().equals(ownerId)) return false;
        if (player.isInvincible()) return false;

        float playerRadius = player.getWidth() / 2.0f * 0.7f;
        float dx = x - (player.getX() + player.getWidth() / 2.0f);
        float dy = y - (player.getY() + player.getHeight() / 2.0f);
        float dist = (float) Math.sqrt(dx * dx + dy * dy);

        return dist < playerRadius + radius;
    }

    public String getId() { return id; }
    public float getX() { return x; }
    public float getY() { return y; }
    public float getVx() { return vx; }
    public float getVy() { return vy; }
    public String getOwnerId() { return ownerId; }
    public int getDamage() { return damage; }
    public String getColor() { return color; }
    public float getRadius() { return radius; }
    public boolean isActive() { return active; }

    public void setActive(boolean active) {
        this.active = active;
    }
}
