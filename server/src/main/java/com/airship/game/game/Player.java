package com.airship.game.game;

import java.util.List;
import java.util.ArrayList;

public class Player {

    private String id;
    private String name;
    private volatile float x;
    private volatile float y;
    private volatile float vx;
    private volatile float vy;
    private int width = 48;
    private int height = 32;
    private float speed = 200;
    private float boostSpeed = 320;
    private String color;
    private volatile int hp;
    private int maxHp = 100;
    private volatile int score;
    private volatile int kills;
    private volatile int deaths;
    private volatile boolean active;
    private int facing = 1;
    private boolean invincible = false;
    private long invincibleTime = 0;
    private long lastShotTime = 0;
    private long shootCooldown = 200;
    private float bulletSpeed = 400;
    private int bulletDamage = 15;
    private long respawnTime = 3000;
    private long deadTime = 0;
    private long deathTimestamp = 0;
    private volatile boolean boosting = false;
    private volatile boolean shooting = false;
    private volatile float inputDx = 0;
    private volatile float inputDy = 0;

    private String powerUpType = null;
    private volatile float powerUpTime = 0;
    private float powerUpDuration = 10000;
    private int lastHp = 100;

    private static final String[] COLORS = {
            "#44aaff", "#ff6644", "#44ff66", "#ff44aa",
            "#ffaa44", "#aa44ff", "#44ffff", "#ffff44"
    };
    private static int colorIndex = 0;

    public Player(String id, String name) {
        this.id = id;
        this.name = name;
        this.color = COLORS[colorIndex % COLORS.length];
        colorIndex++;
        this.hp = maxHp;
        this.active = true;
        this.score = 0;
        this.kills = 0;
        this.deaths = 0;
    }

    public void update(float deltaTime) {
        if (!active) {
            deadTime += deltaTime * 1000;
            if (deadTime >= respawnTime) {
                respawn();
            }
            return;
        }

        if (invincible) {
            invincibleTime -= deltaTime * 1000;
            if (invincibleTime <= 0) {
                invincible = false;
            }
        }

        if (powerUpType != null) {
            powerUpTime -= deltaTime * 1000;
            if (powerUpTime <= 0) {
                clearPowerUp();
            }
        }

        float baseSpeed = speed;
        float baseBoostSpeed = boostSpeed;
        if ("power_core".equals(powerUpType)) {
            baseSpeed *= 1.5f;
            baseBoostSpeed *= 1.4f;
        }

        float currentSpeed = boosting ? baseBoostSpeed : baseSpeed;
        vx = inputDx * currentSpeed;
        vy = inputDy * currentSpeed;

        x += vx * deltaTime;
        y += vy * deltaTime;

        if (inputDx > 0) facing = 1;
        else if (inputDx < 0) facing = -1;

        x = Math.max(0, Math.min(960 - width, x));
        y = Math.max(0, Math.min(640 - height, y));
    }

    public boolean canShoot() {
        if (!active) return false;
        long actualCooldown = "power_core".equals(powerUpType) ? (long)(shootCooldown * 0.6f) : shootCooldown;
        return System.currentTimeMillis() - lastShotTime >= actualCooldown;
    }

    public List<Bullet> shoot() {
        if (!canShoot()) return new ArrayList<>();

        lastShotTime = System.currentTimeMillis();

        float bulletX = x + width / 2 + facing * width / 2;
        float bulletY = y + height / 2;

        int actualDamage = "cannon_part".equals(powerUpType) ? bulletDamage * 3 : bulletDamage;
        float actualSpeed = "power_core".equals(powerUpType) ? bulletSpeed * 1.3f : bulletSpeed;
        String bulletColor = "cannon_part".equals(powerUpType) ? "#ff2244" :
                            "power_core".equals(powerUpType) ? "#ffcc00" : color;
        float bulletRadius = "cannon_part".equals(powerUpType) ? 8 : 4;

        List<Bullet> bullets = new ArrayList<>();

        if ("power_core".equals(powerUpType)) {
            int[] angles = {-15, 0, 15};
            for (int angleDeg : angles) {
                double angle = Math.toRadians(angleDeg);
                float vx = (float)Math.cos(angle) * actualSpeed * facing;
                float vy = (float)Math.sin(angle) * actualSpeed;
                Bullet bullet = new Bullet(bulletX, bulletY, vx, vy, id, actualDamage, bulletColor);
                bullet.setRadius(bulletRadius);
                bullets.add(bullet);
            }
        } else if ("cannon_part".equals(powerUpType)) {
            Bullet bullet = new Bullet(
                    bulletX + facing * 4, bulletY,
                    facing * actualSpeed * 0.8f, 0,
                    id, actualDamage, bulletColor
            );
            bullet.setRadius(bulletRadius);
            bullets.add(bullet);
        } else {
            Bullet bullet = new Bullet(
                    bulletX, bulletY,
                    facing * actualSpeed, 0,
                    id, actualDamage, bulletColor
            );
            bullet.setRadius(bulletRadius);
            bullets.add(bullet);
        }

        return bullets;
    }

    public boolean takeDamage(int damage, String attackerId) {
        if (!active || invincible) return false;

        lastHp = hp;
        hp -= damage;
        
        if (hp <= 0) {
            hp = 0;
            die();
            return true;
        }
        return false;
    }

    public boolean checkShouldDropPowerUp() {
        int halfHp = maxHp / 2;
        return lastHp > halfHp && hp <= halfHp && hp > 0;
    }

    public void setPowerUp(String type, float duration) {
        this.powerUpType = type;
        this.powerUpTime = duration;
        this.powerUpDuration = duration;
    }

    public void clearPowerUp() {
        this.powerUpType = null;
        this.powerUpTime = 0;
    }

    public boolean hasPowerUp() {
        return powerUpType != null && powerUpTime > 0;
    }

    private void die() {
        active = false;
        deadTime = 0;
        deaths++;
        deathTimestamp = System.currentTimeMillis();
    }

    public void respawn() {
        active = true;
        hp = maxHp;
        lastHp = maxHp;
        deadTime = 0;
        clearPowerUp();
        x = (float) (Math.random() * (960 - width));
        y = (float) (Math.random() * (640 - height));
        invincible = true;
        invincibleTime = 2000;
    }

    public void addKill() {
        kills++;
        score += 100;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public float getX() { return x; }
    public float getY() { return y; }
    public float getVx() { return vx; }
    public float getVy() { return vy; }
    public int getWidth() { return width; }
    public int getHeight() { return height; }
    public String getColor() { return color; }
    public int getHp() { return hp; }
    public int getMaxHp() { return maxHp; }
    public int getScore() { return score; }
    public int getKills() { return kills; }
    public int getDeaths() { return deaths; }
    public boolean isActive() { return active; }
    public int getFacing() { return facing; }
    public boolean isInvincible() { return invincible; }
    public boolean isBoosting() { return boosting; }
    public boolean isShooting() { return shooting; }
    public String getPowerUpType() { return powerUpType; }
    public float getPowerUpTime() { return powerUpTime; }
    public float getPowerUpDuration() { return powerUpDuration; }

    public void setX(float x) { this.x = x; }
    public void setY(float y) { this.y = y; }
    public void setInputDx(float dx) { this.inputDx = dx; }
    public void setInputDy(float dy) { this.inputDy = dy; }
    public void setBoosting(boolean boosting) { this.boosting = boosting; }
    public void setShooting(boolean shooting) { this.shooting = shooting; }
    public void setHp(int hp) { this.hp = hp; }
    public void setScore(int score) { this.score = score; }

    public void setRandomSpawn() {
        this.x = (float) (Math.random() * (960 - width));
        this.y = (float) (Math.random() * (640 - height));
    }
}
