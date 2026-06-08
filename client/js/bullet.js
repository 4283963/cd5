class Bullet {
    constructor(x, y, vx, vy, ownerId, damage = 10, color = '#ff6600', id = null) {
        this.id = id || ('local_' + Math.random().toString(36).substr(2, 9));
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.ownerId = ownerId;
        this.damage = damage;
        this.color = color;
        this.radius = 4;
        this.active = true;
        this.age = 0;
        this.maxAge = 2000;
        this.isPredicted = false;
        this.hasTarget = false;
        this.targetX = x;
        this.targetY = y;
        this.targetVx = vx;
        this.targetVy = vy;
        this.lerpFactor = 0.15;
        this.serverTime = 0;
    }

    update(deltaTime) {
        this.age += deltaTime;
        if (this.age >= this.maxAge) {
            this.active = false;
        }

        if (this.isPredicted || !this.hasTarget) {
            this.x += this.vx * deltaTime;
            this.y += this.vy * deltaTime;
        } else {
            this.targetX += this.targetVx * deltaTime;
            this.targetY += this.targetVy * deltaTime;
            
            this.x += (this.targetX - this.x) * this.lerpFactor;
            this.y += (this.targetY - this.y) * this.lerpFactor;
            this.vx += (this.targetVx - this.vx) * this.lerpFactor;
            this.vy += (this.targetVy - this.vy) * this.lerpFactor;
        }

        if (this.x < -20 || this.x > 980 || this.y < -20 || this.y > 660) {
            this.active = false;
        }
    }

    setTarget(x, y, vx, vy) {
        this.targetX = x;
        this.targetY = y;
        this.targetVx = vx;
        this.targetVy = vy;
        this.hasTarget = true;
    }

    setServerData(serverBulletData) {
        if (serverBulletData.id) {
            this.id = serverBulletData.id;
        }
        this.setTarget(
            serverBulletData.x,
            serverBulletData.y,
            serverBulletData.vx,
            serverBulletData.vy
        );
        if (serverBulletData.damage) this.damage = serverBulletData.damage;
        if (serverBulletData.color) this.color = serverBulletData.color;
        if (serverBulletData.radius) this.radius = serverBulletData.radius;
        this.isPredicted = false;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        
        if (this.isPredicted) {
            ctx.globalAlpha = 0.7;
        }
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    toData() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            ownerId: this.ownerId,
            damage: this.damage,
            color: this.color,
            radius: this.radius
        };
    }

    static fromData(data) {
        const bullet = new Bullet(
            data.x, data.y, data.vx, data.vy,
            data.ownerId, data.damage, data.color, data.id
        );
        if (data.radius) bullet.radius = data.radius;
        bullet.isPredicted = false;
        bullet.hasTarget = false;
        return bullet;
    }

    static createPredicted(x, y, vx, vy, ownerId, damage, color) {
        const bullet = new Bullet(x, y, vx, vy, ownerId, damage, color);
        bullet.isPredicted = true;
        return bullet;
    }
}
