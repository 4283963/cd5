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

        const movement = input.getMovementVector();
        const boosting = input.isBoosting();
        const currentSpeed = boosting ? this.boostSpeed : this.speed;

        this.vx = movement.dx * currentSpeed;
        this.vy = movement.dy * currentSpeed;

        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        if (movement.dx > 0) this.facing = 1;
        else if (movement.dx < 0) this.facing = -1;

        this.x = Math.max(0, Math.min(960 - this.width, this.x));
        this.y = Math.max(0, Math.min(640 - this.height, this.y));

        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }

        this.engineGlow = Math.abs(this.vx) + Math.abs(this.vy);
        this.engineGlow = Math.min(1, this.engineGlow / this.speed);
    }

    canShoot() {
        return this.active && this.shootCooldown <= 0;
    }

    shoot() {
        if (!this.canShoot()) return null;
        
        this.shootCooldown = this.shootRate;
        
        const bulletX = this.x + this.width / 2 + this.facing * this.width / 2;
        const bulletY = this.y + this.height / 2;
        
        const bullet = new Bullet(
            bulletX, bulletY,
            this.facing * this.bulletSpeed, 0,
            this.id,
            this.bulletDamage,
            this.color
        );
        
        return bullet;
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
        
        ctx.restore();
        ctx.globalAlpha = 1;

        this.drawNameTag(ctx);
        this.drawHealthBar(ctx);
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
        this.x = data.x;
        this.y = data.y;
        this.vx = data.vx;
        this.vy = data.vy;
        this.hp = data.hp;
        this.score = data.score;
        this.kills = data.kills;
        this.deaths = data.deaths;
        this.active = data.active;
        this.facing = data.facing;
        this.invincible = data.invincible;
    }
}
