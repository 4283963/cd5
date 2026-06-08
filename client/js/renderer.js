class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        this.width = canvas.width;
        this.height = canvas.height;
        this.stars = [];
        this.clouds = [];
        this.initBackground();
    }

    initBackground() {
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 20 + 10,
                brightness: Math.random()
            });
        }

        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height * 0.6,
                width: Math.random() * 80 + 60,
                height: Math.random() * 20 + 15,
                speed: Math.random() * 30 + 10
            });
        }
    }

    clear() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#0a0a2e');
        gradient.addColorStop(0.5, '#1a1a4e');
        gradient.addColorStop(1, '#2a2a5e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    updateBackground(deltaTime) {
        for (const star of this.stars) {
            star.x -= star.speed * deltaTime;
            if (star.x < 0) {
                star.x = this.width;
                star.y = Math.random() * this.height;
            }
        }

        for (const cloud of this.clouds) {
            cloud.x -= cloud.speed * deltaTime;
            if (cloud.x + cloud.width < 0) {
                cloud.x = this.width;
                cloud.y = Math.random() * this.height * 0.6;
            }
        }
    }

    drawBackground() {
        for (const star of this.stars) {
            const alpha = 0.3 + star.brightness * 0.7;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        }

        for (const cloud of this.clouds) {
            this.ctx.fillStyle = 'rgba(100, 120, 180, 0.15)';
            this.drawPixelCloud(cloud.x, cloud.y, cloud.width, cloud.height);
        }
    }

    drawPixelCloud(x, y, w, h) {
        const segments = Math.floor(w / 16);
        for (let i = 0; i < segments; i++) {
            const sx = x + i * 16;
            const sh = h + Math.sin(i * 0.8) * 6;
            const sy = y + Math.cos(i * 0.6) * 4;
            this.ctx.fillRect(sx, sy, 16, sh);
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(100, 150, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 32;
        for (let x = 0; x < this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    drawBorder() {
        this.ctx.strokeStyle = '#4a4a8a';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(1, 1, this.width - 2, this.height - 2);
    }

    drawParticles(particles) {
        for (const p of particles) {
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        this.ctx.globalAlpha = 1;
    }

    drawScorePopup(popups) {
        for (const popup of popups) {
            this.ctx.font = 'bold 16px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.globalAlpha = popup.alpha;
            this.ctx.fillStyle = '#ffcc00';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText(popup.text, popup.x, popup.y);
            this.ctx.fillText(popup.text, popup.x, popup.y);
        }
        this.ctx.globalAlpha = 1;
    }

    drawFloatingText(texts) {
        for (const t of texts) {
            this.ctx.font = `bold ${t.size || 14}px Courier New`;
            this.ctx.textAlign = 'center';
            this.ctx.globalAlpha = t.alpha;
            this.ctx.fillStyle = t.color;
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText(t.text, t.x, t.y);
            this.ctx.fillText(t.text, t.x, t.y);
        }
        this.ctx.globalAlpha = 1;
    }
}
