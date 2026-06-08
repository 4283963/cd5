class Bullet {
    constructor(x, y, vx, vy, ownerId, damage = 10, color = '#ff6600') {
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
    }

    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.age += deltaTime;
        
        if (this.age >= this.maxAge) {
            this.active = false;
        }

        if (this.x < -20 || this.x > 980 || this.y < -20 || this.y > 660) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        
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
            data.ownerId, data.damage, data.color
        );
        if (data.radius) bullet.radius = data.radius;
        return bullet;
    }
}
