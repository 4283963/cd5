class PowerUp {
    constructor(id, type, x, y) {
        this.id = id;
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 24;
        this.active = true;
        this.age = 0;
        this.maxAge = 15000;
        this.bobOffset = 0;
        this.bobSpeed = 3;
        this.spinAngle = 0;
        this.spinSpeed = 2;
        this.glowPhase = 0;
        this.dropY = y;
        this.dropSpeed = 100;
        this.dropping = true;
        this.floorY = y + 80;
        this.bounceCount = 0;
    }

    static TYPE_POWER_CORE = 'power_core';
    static TYPE_CANNON_PART = 'cannon_part';

    static COLORS = {
        [PowerUp.TYPE_POWER_CORE]: '#ffcc00',
        [PowerUp.TYPE_CANNON_PART]: '#ff4466'
    };

    static NAMES = {
        [PowerUp.TYPE_POWER_CORE]: '动力核心',
        [PowerUp.TYPE_CANNON_PART]: '超级大炮'
    };

    update(deltaTime) {
        this.age += deltaTime;
        
        if (this.age >= this.maxAge) {
            this.active = false;
            return;
        }

        if (this.dropping) {
            this.dropSpeed += 300 * deltaTime;
            this.y += this.dropSpeed * deltaTime;
            
            if (this.y >= this.floorY) {
                this.y = this.floorY;
                this.bounceCount++;
                this.dropSpeed = -this.dropSpeed * 0.4;
                
                if (this.bounceCount >= 3) {
                    this.dropping = false;
                    this.y = this.floorY;
                }
            }
        } else {
            this.bobOffset = Math.sin(this.age * this.bobSpeed) * 4;
            this.spinAngle += this.spinSpeed * deltaTime;
            this.glowPhase = (this.glowPhase + deltaTime * 4) % (Math.PI * 2);
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        
        const drawY = this.y + (this.dropping ? 0 : this.bobOffset);
        const centerX = this.x + this.width / 2;
        const centerY = drawY + this.height / 2;

        const glowIntensity = 0.5 + Math.sin(this.glowPhase) * 0.3;
        const color = PowerUp.COLORS[this.type] || '#ffffff';

        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, this.width * 1.5
        );
        gradient.addColorStop(0, color + Math.floor(glowIntensity * 128).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, color + '00');
        ctx.fillStyle = gradient;
        ctx.fillRect(centerX - this.width * 1.5, centerY - this.height * 1.5, 
                    this.width * 3, this.height * 3);

        ctx.translate(centerX, centerY);
        ctx.rotate(this.spinAngle);

        if (this.type === PowerUp.TYPE_POWER_CORE) {
            this.drawPowerCore(ctx, color);
        } else {
            this.drawCannonPart(ctx, color);
        }

        ctx.restore();

        if (this.age > this.maxAge - 3000) {
            const blink = Math.floor(this.age / 100) % 2 === 0;
            if (blink) {
                ctx.globalAlpha = 0.3;
            }
        }
        ctx.globalAlpha = 1;
    }

    drawPowerCore(ctx, color) {
        const size = this.width / 2;
        
        ctx.fillStyle = color;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = Math.cos(angle) * size;
            const y = Math.sin(angle) * size;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = Math.cos(angle) * size * 0.5;
            const y = Math.sin(angle) * size * 0.5;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = color;
        ctx.fillRect(-2, -size * 1.3, 4, size * 0.6);
        ctx.fillRect(-2, size * 0.7, 4, size * 0.6);
    }

    drawCannonPart(ctx, color) {
        const w = this.width / 2;
        const h = this.height / 2;

        ctx.fillStyle = color;
        ctx.fillRect(-w, -h * 0.6, w * 2, h * 1.2);

        ctx.fillStyle = '#333333';
        ctx.fillRect(w * 0.3, -h * 0.8, w * 0.8, h * 0.4);
        ctx.fillRect(w * 0.3, h * 0.4, w * 0.8, h * 0.4);

        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.arc(w * 0.7, -h * 0.6, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(w * 0.7, h * 0.6, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffff88';
        ctx.fillRect(-w * 0.8, -h * 0.3, w * 0.4, h * 0.6);
    }

    checkCollision(player) {
        if (!this.active || this.dropping) return false;
        
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const itemCenterX = this.x + this.width / 2;
        const itemCenterY = this.y + this.bobOffset + this.height / 2;

        const dx = playerCenterX - itemCenterX;
        const dy = playerCenterY - itemCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = player.width / 2 + this.width / 2;

        return dist < minDist * 0.7;
    }

    toData() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.floorY,
            age: this.age
        };
    }

    static fromData(data) {
        const powerUp = new PowerUp(data.id, data.type, data.x, data.y - 80);
        powerUp.floorY = data.y;
        powerUp.dropping = false;
        if (data.age) powerUp.age = data.age;
        return powerUp;
    }

    static getRandomType() {
        return Math.random() < 0.5 ? PowerUp.TYPE_POWER_CORE : PowerUp.TYPE_CANNON_PART;
    }
}
