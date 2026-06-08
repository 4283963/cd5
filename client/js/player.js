class Player {
    constructor(id, name, x, y, color = '#44aaff') {
        this.id = id;
        this.name = name;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.width = 48;
        this.height = 32;
        this.speed = 200;
        this.boostSpeed = 320;
        this.color = color;
        this.hp = 100;
        this.maxHp = 100;
        this.score = 0;
        this.kills = 0;
        this.deaths = 0;
        this.active = true;
        this.respawnTime = 3000;
        this.deadTime = 0;
        this.shootCooldown = 0;
        this.shootRate = 200;
        this.bulletSpeed = 400;
        this.bulletDamage = 15;
        this.lastShotTime = 0;
        this.facing = 1;
        this.engineGlow = 0;
        this.invincible = false;
        this.invincibleTime = 0;
        this.isLocal = false;
        this.targetX = x;
        this.targetY = y;
        this.targetVx = 0;
        this.targetVy = 0;
        this.hasTarget = false;
        this.lerpFactor = 0.12;

        this.powerUpType = null;
        this.powerUpTime = 0;
        this.powerUpDuration = 10000;
        this.baseSpeed = 200;
        this.baseBoostSpeed = 320;
        this.baseShootRate = 200;
        this.baseBulletDamage = 15;
        this.baseBulletSpeed = 400;
        this.powerUpFlash = 0;
    }

    update(deltaTime, input) {
        if (!this.active) {
            this.deadTime += deltaTime;
            if (this.deadTime >= this.respawnTime) {
                this.respawn();
            }
            return;
        }

        if (this.invincible) {
            this.invincibleTime -= deltaTime;
            if (this.invincibleTime <= 0) {
                this.invincible = false;
            }
        }

        if (this.powerUpType) {
            this.powerUpTime -= deltaTime;
            this.powerUpFlash = (this.powerUpFlash + deltaTime * 10) % (Math.PI * 2);
            
            if (this.powerUpTime <= 0) {
                this.clearPowerUp();
            }
        }

        const currentSpeed = this.powerUpType === 'power_core' ? this.speed * 1.5 : this.speed;
        const currentBoostSpeed = this.powerUpType === 'power_core' ? this.boostSpeed * 1.4 : this.boostSpeed;

        if (this.isLocal) {
            const movement = input.getMovementVector();
            const boosting = input.isBoosting();
            const speed = boosting ? currentBoostSpeed : currentSpeed;

            this.vx = movement.dx * speed;
            this.vy = movement.dy * speed;

            this.x += this.vx * deltaTime;
            this.y += this.vy * deltaTime;

            if (movement.dx > 0) this.facing = 1;
            else if (movement.dx < 0) this.facing = -1;

            this.x = Math.max(0, Math.min(960 - this.width, this.x));
            this.y = Math.max(0, Math.min(640 - this.height, this.y));
        } else {
            if (this.hasTarget) {
                this.x += (this.targetX - this.x) * this.lerpFactor;
                this.y += (this.targetY - this.y) * this.lerpFactor;
                this.vx += (this.targetVx - this.vx) * this.lerpFactor;
                this.vy += (this.targetVy - this.vy) * this.lerpFactor;
            } else {
                this.x += this.vx * deltaTime;
                this.y += this.vy * deltaTime;
            }

            this.x = Math.max(0, Math.min(960 - this.width, this.x));
            this.y = Math.max(0, Math.min(640 - this.height, this.y));
        }

        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }

        this.engineGlow = Math.abs(this.vx) + Math.abs(this.vy);
        this.engineGlow = Math.min(1, this.engineGlow / currentSpeed);
    }

    canShoot() {
        return this.active && this.shootCooldown <= 0;
    }

    shoot() {
        if (!this.canShoot()) return [];
        
        const actualShootRate = this.powerUpType === 'power_core' ? this.shootRate * 0.6 : this.shootRate;
        this.shootCooldown = actualShootRate;
        
        const bulletX = this.x + this.width / 2 + this.facing * this.width / 2;
        const bulletY = this.y + this.height / 2;
        
        const actualDamage = this.powerUpType === 'cannon_part' ? this.bulletDamage * 3 : this.bulletDamage;
        const actualSpeed = this.powerUpType === 'power_core' ? this.bulletSpeed * 1.3 : this.bulletSpeed;
        const bulletColor = this.powerUpType === 'cannon_part' ? '#ff2244' : 
                           this.powerUpType === 'power_core' ? '#ffcc00' : this.color;
        const bulletRadius = this.powerUpType === 'cannon_part' ? 8 : 4;

        const bullets = [];

        if (this.powerUpType === 'power_core') {
            const angles = [-15, 0, 15];
            for (const angleDeg of angles) {
                const angle = angleDeg * Math.PI / 180;
                const vx = Math.cos(angle) * actualSpeed * this.facing;
                const vy = Math.sin(angle) * actualSpeed;
                const bullet = new Bullet(
                    bulletX, bulletY,
                    vx, vy,
                    this.id,
                    actualDamage,
                    bulletColor
                );
                bullet.radius = bulletRadius;
                bullets.push(bullet);
            }
        } else if (this.powerUpType === 'cannon_part') {
            const bullet = new Bullet(
                bulletX + this.facing * 4, bulletY,
                this.facing * actualSpeed * 0.8, 0,
                this.id,
                actualDamage,
                bulletColor
            );
            bullet.radius = bulletRadius;
            bullets.push(bullet);
        } else {
            const bullet = new Bullet(
                bulletX, bulletY,
                this.facing * actualSpeed, 0,
                this.id,
                actualDamage,
                bulletColor
            );
            bullet.radius = bulletRadius;
            bullets.push(bullet);
        }
        
        return bullets;
    }

    setPowerUp(type, duration = 10000) {
        this.powerUpType = type;
        this.powerUpTime = duration;
        this.powerUpDuration = duration;
    }

    clearPowerUp() {
        this.powerUpType = null;
        this.powerUpTime = 0;
    }

    hasPowerUp() {
        return this.powerUpType !== null && this.powerUpTime > 0;
    }

    takeDamage(damage) {
        if (!this.active || this.invincible) return false;
        
        this.hp -= damage;
        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }
        return true;
    }

    die() {
        this.active = false;
        this.deadTime = 0;
        this.deaths++;
    }

    respawn() {
        this.active = true;
        this.hp = this.maxHp;
        this.deadTime = 0;
        this.x = Math.random() * (960 - this.width);
        this.y = Math.random() * (640 - this.height);
        this.invincible = true;
        this.invincibleTime = 2000;
    }

    addKill() {
        this.kills++;
        this.score += 100;
    }

    draw(ctx) {
        if (!this.active) {
            this.drawDeathEffect(ctx);
            return;
        }

        if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        ctx.save();
        
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        if (this.facing === -1) {
            ctx.translate(centerX, centerY);
            ctx.scale(-1, 1);
            ctx.translate(-centerX, -centerY);
        }

        this.drawAirship(ctx);
        this.drawEngineFlame(ctx);

        if (this.powerUpType) {
            this.drawPowerUpDecoration(ctx);
        }
        
        ctx.restore();
        ctx.globalAlpha = 1;

        this.drawNameTag(ctx);
        this.drawHealthBar(ctx);
        
        if (this.powerUpType) {
            this.drawPowerUpIndicator(ctx);
        }
    }

    drawAirship(ctx) {
        const px = this.x;
        const py = this.y;
        const w = this.width;
        const h = this.height;

        ctx.fillStyle = this.color;
        ctx.fillRect(px + 8, py + 8, w - 16, h - 12);
        
        ctx.fillStyle = this.lightenColor(this.color, 30);
        ctx.fillRect(px + 12, py + 6, w - 24, 4);
        
        ctx.fillStyle = this.darkenColor(this.color, 30);
        ctx.fillRect(px + 8, py + h - 8, w - 16, 4);

        ctx.fillStyle = this.darkenColor(this.color, 40);
        ctx.fillRect(px, py + h / 2 - 2, 12, 8);
        
        ctx.fillStyle = this.lightenColor(this.color, 20);
        ctx.fillRect(px + w - 12, py + 4, 12, h - 8);
        ctx.fillStyle = this.color;
        ctx.fillRect(px + w - 8, py + 6, 8, h - 12);

        ctx.fillStyle = '#88ddff';
        ctx.fillRect(px + w - 18, py + 8, 6, h - 16);
        
        ctx.fillStyle = '#aaffff';
        ctx.fillRect(px + w - 17, py + 9, 2, h - 18);

        ctx.fillStyle = this.darkenColor(this.color, 20);
        ctx.fillRect(px + 16, py + h - 6, 8, 6);
        ctx.fillRect(px + w - 28, py + h - 6, 8, 6);
    }

    drawEngineFlame(ctx) {
        const flameIntensity = 0.5 + this.engineGlow * 0.5;
        const px = this.x;
        const py = this.y;
        const h = this.height;

        const flameColors = ['#ff6600', '#ffaa00', '#ffff88'];
        
        for (let i = 0; i < 3; i++) {
            const flameLen = (8 + Math.random() * 6 * flameIntensity) - i * 2;
            ctx.fillStyle = flameColors[i];
            ctx.globalAlpha = 1 - i * 0.3;
            ctx.fillRect(
                px - flameLen + i * 2,
                py + h / 2 - 4 + i * 1,
                flameLen,
                8 - i * 2
            );
        }
        ctx.globalAlpha = 1;
    }

    drawNameTag(ctx) {
        const centerX = this.x + this.width / 2;
        ctx.font = 'bold 11px Courier New';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(this.name, centerX, this.y - 8);
        ctx.fillText(this.name, centerX, this.y - 8);
    }

    drawHealthBar(ctx) {
        const barWidth = this.width;
        const barHeight = 4;
        const barY = this.y - 5;
        
        ctx.fillStyle = '#330000';
        ctx.fillRect(this.x, barY, barWidth, barHeight);
        
        const hpPercent = this.hp / this.maxHp;
        let hpColor = '#00ff00';
        if (hpPercent < 0.6) hpColor = '#ffff00';
        if (hpPercent < 0.3) hpColor = '#ff0000';
        
        ctx.fillStyle = hpColor;
        ctx.fillRect(this.x, barY, barWidth * hpPercent, barHeight);
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, barY, barWidth, barHeight);
    }

    drawPowerUpDecoration(ctx) {
        const px = this.x;
        const py = this.y;
        const w = this.width;
        const h = this.height;

        if (this.powerUpType === 'power_core') {
            const glowIntensity = 0.5 + Math.sin(this.powerUpFlash) * 0.3;
            
            ctx.fillStyle = `rgba(255, 204, 0, ${glowIntensity * 0.3})`;
            ctx.fillRect(px + 10, py + 2, w - 20, 4);
            ctx.fillRect(px + 6, py + h - 6, w - 12, 4);
            
            ctx.fillStyle = '#ffcc00';
            ctx.fillRect(px + w / 2 - 4, py + 2, 8, 6);
            
            ctx.fillStyle = '#ffff88';
            ctx.fillRect(px + w / 2 - 2, py + 4, 4, 3);
            
            ctx.fillStyle = '#ffcc00';
            ctx.fillRect(px + 14, py - 2, 4, 4);
            ctx.fillRect(px + w - 22, py - 2, 4, 4);
        } else if (this.powerUpType === 'cannon_part') {
            const cannonColor = '#cc2244';
            const cannonHighlight = '#ff6688';
            
            ctx.fillStyle = cannonColor;
            ctx.fillRect(px + w - 8, py + h / 2 - 8, 16, 16);
            
            ctx.fillStyle = cannonHighlight;
            ctx.fillRect(px + w - 6, py + h / 2 - 6, 4, 12);
            
            ctx.fillStyle = '#222222';
            ctx.fillRect(px + w + 4, py + h / 2 - 5, 8, 10);
            
            ctx.fillStyle = '#444444';
            ctx.fillRect(px + w + 6, py + h / 2 - 3, 6, 6);
            
            const muzzleFlash = Math.sin(this.powerUpFlash * 2) > 0 ? 0.5 : 0;
            if (muzzleFlash > 0) {
                ctx.fillStyle = `rgba(255, 200, 100, ${muzzleFlash})`;
                ctx.fillRect(px + w + 10, py + h / 2 - 4, 6, 8);
            }
        }
    }

    drawPowerUpIndicator(ctx) {
        const centerX = this.x + this.width / 2;
        const barWidth = this.width;
        const barHeight = 3;
        const barY = this.y - 14;

        const progress = this.powerUpTime / this.powerUpDuration;
        let color = '#ffcc00';
        if (this.powerUpType === 'power_core') color = '#ffcc00';
        if (this.powerUpType === 'cannon_part') color = '#ff4466';

        if (progress < 0.3 && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        ctx.fillStyle = '#333333';
        ctx.fillRect(this.x, barY, barWidth, barHeight);
        
        ctx.fillStyle = color;
        ctx.fillRect(this.x, barY, barWidth * progress, barHeight);
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, barY, barWidth, barHeight);
        
        ctx.globalAlpha = 1;

        ctx.font = 'bold 9px Courier New';
        ctx.textAlign = 'center';
        ctx.fillStyle = color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        
        let label = this.powerUpType === 'power_core' ? '⚡' : '💥';
        ctx.strokeText(label, centerX, this.y - 16);
        ctx.fillText(label, centerX, this.y - 16);
    }

    drawDeathEffect(ctx) {
        const progress = this.deadTime / this.respawnTime;
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + progress * 2;
            const dist = progress * 30;
            const px = centerX + Math.cos(angle) * dist;
            const py = centerY + Math.sin(angle) * dist;
            const size = 4 * (1 - progress);
            
            ctx.fillStyle = i % 2 === 0 ? '#ff6600' : '#ffaa00';
            ctx.globalAlpha = 1 - progress;
            ctx.fillRect(px - size / 2, py - size / 2, size, size);
        }
        ctx.globalAlpha = 1;

        const respawnSeconds = Math.ceil((this.respawnTime - this.deadTime) / 1000);
        ctx.font = 'bold 14px Courier New';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff6600';
        ctx.fillText(`RESPAWNING ${respawnSeconds}...`, centerX, centerY);
    }

    lightenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + amount);
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + amount);
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + amount);
        return `rgb(${r},${g},${b})`;
    }

    darkenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - amount);
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - amount);
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - amount);
        return `rgb(${r},${g},${b})`;
    }

    toData() {
        return {
            id: this.id,
            name: this.name,
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            color: this.color,
            hp: this.hp,
            maxHp: this.maxHp,
            score: this.score,
            kills: this.kills,
            deaths: this.deaths,
            active: this.active,
            facing: this.facing,
            invincible: this.invincible
        };
    }

    static fromData(data) {
        const player = new Player(data.id, data.name, data.x, data.y, data.color);
        player.hp = data.hp;
        player.maxHp = data.maxHp;
        player.score = data.score;
        player.kills = data.kills;
        player.deaths = data.deaths;
        player.active = data.active;
        player.facing = data.facing;
        player.invincible = data.invincible;
        if (data.vx !== undefined) player.vx = data.vx;
        if (data.vy !== undefined) player.vy = data.vy;
        return player;
    }

    syncFromData(data) {
        if (this.isLocal) {
            this.hp = data.hp;
            this.score = data.score;
            this.kills = data.kills;
            this.deaths = data.deaths;
            this.active = data.active;
            this.invincible = data.invincible;
            
            if (data.vx !== undefined) this.vx = data.vx;
            if (data.vy !== undefined) this.vy = data.vy;

            if (data.powerUpType !== undefined) {
                this.powerUpType = data.powerUpType;
                this.powerUpTime = data.powerUpTime || 0;
                this.powerUpDuration = data.powerUpDuration || 10000;
            }
        } else {
            this.targetX = data.x;
            this.targetY = data.y;
            this.targetVx = data.vx;
            this.targetVy = data.vy;
            this.hasTarget = true;
            
            this.hp = data.hp;
            this.score = data.score;
            this.kills = data.kills;
            this.deaths = data.deaths;
            this.active = data.active;
            this.facing = data.facing;
            this.invincible = data.invincible;

            if (data.powerUpType !== undefined) {
                this.powerUpType = data.powerUpType;
                this.powerUpTime = data.powerUpTime || 0;
                this.powerUpDuration = data.powerUpDuration || 10000;
            }
        }
    }
}
