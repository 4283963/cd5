package com.airship.game.game;

public class PowerUp {

    public static final String TYPE_POWER_CORE = "power_core";
    public static final String TYPE_CANNON_PART = "cannon_part";

    private String id;
    private String type;
    private volatile float x;
    private volatile float y;
    private float width = 24;
    private float height = 24;
    private boolean active = true;
    private float age = 0;
    private float maxAge = 15000;
    private String droppedBy;

    private static int counter = 0;

    public PowerUp(String type, float x, float y, String droppedBy) {
        this.id = "pu_" + (++counter);
        this.type = type;
        this.x = x;
        this.y = y;
        this.droppedBy = droppedBy;
    }

    public void update(float deltaTime) {
        age += deltaTime * 1000;
        if (age >= maxAge) {
            active = false;
        }
    }

    public boolean checkCollision(Player player) {
        if (!active || player == null || !player.isActive()) return false;

        float playerCenterX = player.getX() + player.getWidth() / 2.0f;
        float playerCenterY = player.getY() + player.getHeight() / 2.0f;
        float itemCenterX = x + width / 2.0f;
        float itemCenterY = y + height / 2.0f;

        float dx = playerCenterX - itemCenterX;
        float dy = playerCenterY - itemCenterY;
        float dist = (float) Math.sqrt(dx * dx + dy * dy);
        float minDist = player.getWidth() / 2.0f + width / 2.0f;

        return dist < minDist * 0.7f;
    }

    public String getId() { return id; }
    public String getType() { return type; }
    public float getX() { return x; }
    public float getY() { return y; }
    public float getWidth() { return width; }
    public float getHeight() { return height; }
    public boolean isActive() { return active; }
    public float getAge() { return age; }
    public float getMaxAge() { return maxAge; }
    public String getDroppedBy() { return droppedBy; }

    public void setActive(boolean active) {
        this.active = active;
    }

    public static String getRandomType() {
        return Math.random() < 0.5 ? TYPE_POWER_CORE : TYPE_CANNON_PART;
    }
}
