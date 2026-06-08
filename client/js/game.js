class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.renderer = new Renderer(this.canvas);
        this.input = new InputHandler();
        this.network = new NetworkManager();
        
        this.players = new Map();
        this.bullets = [];
        this.particles = [];
        this.scorePopups = [];
        this.floatingTexts = [];
        
        this.localPlayer = null;
        this.localPlayerId = null;
        
        this.lastTime = 0;
        this.running = false;
        this.gameStarted = false;
        
        this.serverTickRate = 60;
        this.serverDelta = 1000 / this.serverTickRate;
        
        this.inputSendTimer = 0;
        this.inputSendRate = 60;
        
        this.particlePool = [];
        
        this.initUI();
        this.initNetwork();
    }

    initUI() {
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.startBtn = document.getElementById('startBtn');
        this.respawnBtn = document.getElementById('respawnBtn');
        this.startNameInput = document.getElementById('startNameInput');
        this.nameInput = document.getElementById('nameInput');
        this.scoreEl = document.getElementById('score');
        this.hpEl = document.getElementById('hp');
        this.pingEl = document.getElementById('ping');
        this.playersOnlineEl = document.getElementById('playersOnline');
        this.connectionStatusEl = document.getElementById('connectionStatus');
        this.leaderboardList = document.getElementById('leaderboardList');
        this.gameOverTitle = document.getElementById('gameOverTitle');
        this.gameOverStats = document.getElementById('gameOverStats');

        this.startBtn.addEventListener('click', () => this.startGame());
        this.respawnBtn.addEventListener('click', () => this.respawn());
    }

    initNetwork() {
        this.network.on('welcome', (data) => {
            this.localPlayerId = data.playerId;
            this.updateConnectionStatus('已连接');
        });

        this.network.on('playerJoined', (data) => {
            console.log('Player joined:', data);
            this.addFloatingText(`${data.name} 加入了游戏!`, 480, 100, '#88ff88');
        });

        this.network.on('playerLeft', (data) => {
            console.log('Player left:', data);
            this.players.delete(data.playerId);
            this.addFloatingText(`${data.name} 离开了游戏`, 480, 100, '#ff8888');
        });

        this.network.on('gameState', (data) => {
            this.handleGameState(data);
        });

        this.network.on('bulletFired', (data) => {
            this.handleBulletFired(data);
        });

        this.network.on('playerHit', (data) => {
            this.handlePlayerHit(data);
        });

        this.network.on('playerKilled', (data) => {
            this.handlePlayerKilled(data);
        });

        this.network.on('leaderboard', (data) => {
            this.updateLeaderboard(data.players);
        });

        this.network.on('pingUpdate', (data) => {
            this.pingEl.textContent = `延迟: ${data.ping}ms`;
        });

        this.network.on('disconnect', () => {
            this.updateConnectionStatus('已断开');
        });
    }

    async startGame() {
        const playerName = this.startNameInput.value.trim() || 'Player';
        this.nameInput.value = playerName;

        try {
            await this.network.connect(playerName);
            this.startScreen.style.display = 'none';
            this.gameStarted = true;
            this.running = true;
            this.lastTime = performance.now();
            this.gameLoop();
        } catch (e) {
            this.updateConnectionStatus('连接失败，请确保服务端已启动');
            alert('无法连接到游戏服务器！请先启动 Java 服务端。\n\n如果在本地运行，请确保 server 项目已启动在 8080 端口。');
        }
    }

    respawn() {
        this.gameOverScreen.style.display = 'none';
        this.network.send({ type: 'respawn' });
    }

    gameLoop() {
        if (!this.running) return;

        requestAnimationFrame(() => this.gameLoop());

        const currentTime = performance.now();
        const deltaTime = Math.min(currentTime - this.lastTime, 100);
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render(deltaTime);
        
        this.input.clearFrame();
    }

    update(deltaTime) {
        const dt = deltaTime / 1000;

        this.renderer.updateBackground(dt);

        if (this.localPlayer) {
            const prevShooting = this.localPlayer.shootCooldown > 0;
            
            this.localPlayer.update(dt, this.input);

            if (this.input.isShooting() && this.localPlayer.canShoot()) {
                const bullet = this.localPlayer.shoot();
                if (bullet) {
                    this.network.sendShoot();
                }
            }
        }

        this.inputSendTimer += deltaTime;
        if (this.inputSendTimer >= 1000 / this.inputSendRate) {
            this.inputSendTimer = 0;
            this.sendInputToServer();
        }

        for (const [id, player] of this.players) {
            if (id !== this.localPlayerId) {
                player.update(dt, {
                    getMovementVector: () => ({ dx: player.vx / player.speed, dy: player.vy / player.speed }),
                    isShooting: () => false,
                    isBoosting: () => false
                });
            }
        }

        for (const bullet of this.bullets) {
            bullet.update(dt);
        }

        this.bullets = this.bullets.filter(b => b.active);
        this.updateParticles(dt);
        this.updateScorePopups(dt);
        this.updateFloatingTexts(dt);
        this.updateUI();
    }

    sendInputToServer() {
        if (!this.network.isConnected() || !this.localPlayer) return;

        const movement = this.input.getMovementVector();
        this.network.sendInput({
            dx: movement.dx,
            dy: movement.dy,
            shooting: this.input.isShooting(),
            boosting: this.input.isBoosting()
        });
    }

    handleGameState(data) {
        for (const playerData of data.players) {
            let player = this.players.get(playerData.id);
            
            if (!player) {
                player = Player.fromData(playerData);
                this.players.set(playerData.id, player);
            } else {
                player.syncFromData(playerData);
            }

            if (playerData.id === this.localPlayerId) {
                this.localPlayer = player;
                
                if (!player.active && this.gameOverScreen.style.display === 'none') {
                    this.showGameOver(player);
                } else if (player.active && this.gameOverScreen.style.display !== 'none') {
                    this.gameOverScreen.style.display = 'none';
                }
            }
        }

        this.playersOnlineEl.textContent = `在线: ${data.players.length}`;
    }

    handleBulletFired(data) {
        const bullet = Bullet.fromData(data.bullet);
        this.bullets.push(bullet);
        this.createMuzzleFlash(bullet.x, bullet.y, bullet.color);
    }

    handlePlayerHit(data) {
        const player = this.players.get(data.playerId);
        if (player) {
            player.hp = data.hp;
            this.createHitEffect(player.x + player.width / 2, player.y + player.height / 2);
        }
        
        if (data.playerId === this.localPlayerId) {
            this.screenShake(5, 3);
        }
    }

    handlePlayerKilled(data) {
        const victim = this.players.get(data.victimId);
        const killer = this.players.get(data.killerId);

        if (victim) {
            victim.active = false;
            victim.deaths = data.victimDeaths;
            this.createExplosion(victim.x + victim.width / 2, victim.y + victim.height / 2);
        }

        if (killer) {
            killer.kills = data.killerKills;
            killer.score = data.killerScore;
            
            if (data.killerId === this.localPlayerId) {
                this.addScorePopup(`+100 击杀 ${data.victimName}`, 
                    killer.x + killer.width / 2, killer.y - 20);
            }
        }

        if (data.victimId === this.localPlayerId) {
            this.screenShake(15, 500);
        }
    }

    showGameOver(player) {
        this.gameOverTitle.textContent = '你被击落了!';
        this.gameOverStats.innerHTML = `
            得分: ${player.score}<br>
            击杀: ${player.kills}<br>
            死亡: ${player.deaths}<br>
            胜率: ${player.kills + player.deaths > 0 
                ? Math.round(player.kills / (player.kills + player.deaths) * 100) : 0}%
        `;
        this.gameOverScreen.style.display = 'flex';
    }

    render() {
        this.renderer.clear();
        this.renderer.drawBackground();
        this.renderer.drawGrid();

        this.renderer.drawParticles(this.particles);

        for (const bullet of this.bullets) {
            bullet.draw(this.renderer.ctx);
        }

        const playersList = Array.from(this.players.values());
        playersList.sort((a, b) => a.y - b.y);
        
        for (const player of playersList) {
            player.draw(this.renderer.ctx);
        }

        this.renderer.drawScorePopup(this.scorePopups);
        this.renderer.drawFloatingText(this.floatingTexts);
        this.renderer.drawBorder();
    }

    updateUI() {
        if (this.localPlayer) {
            this.scoreEl.textContent = `得分: ${this.localPlayer.score}`;
            this.hpEl.textContent = `生命: ${Math.max(0, Math.round(this.localPlayer.hp))}`;
        }
    }

    updateLeaderboard(players) {
        const sorted = [...players].sort((a, b) => b.score - a.score).slice(0, 10);
        this.leaderboardList.innerHTML = sorted.map(p => 
            `<li><span>${p.name}</span><span>${p.score}</span></li>`
        ).join('');
    }

    createExplosion(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 150;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 5,
                color: ['#ff6600', '#ffaa00', '#ff4400', '#ffff88'][Math.floor(Math.random() * 4)],
                alpha: 1,
                decay: 1 + Math.random()
            });
        }
    }

    createHitEffect(x, y) {
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 30 + Math.random() * 80;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 3,
                color: '#ffff88',
                alpha: 1,
                decay: 2 + Math.random()
            });
        }
    }

    createMuzzleFlash(x, y, color) {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 8,
                y: y + (Math.random() - 0.5) * 8,
                vx: (Math.random() - 0.5) * 50,
                vy: (Math.random() - 0.5) * 50,
                size: 2 + Math.random() * 3,
                color: color,
                alpha: 1,
                decay: 3
            });
        }
    }

    updateParticles(dt) {
        for (const p of this.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.alpha -= p.decay * dt;
            p.size *= 0.98;
        }
        this.particles = this.particles.filter(p => p.alpha > 0);
    }

    addScorePopup(text, x, y) {
        this.scorePopups.push({
            text: text,
            x: x,
            y: y,
            vy: -50,
            alpha: 1,
            life: 1.5
        });
    }

    updateScorePopups(dt) {
        for (const popup of this.scorePopups) {
            popup.y += popup.vy * dt;
            popup.life -= dt;
            popup.alpha = Math.min(1, popup.life / 0.5);
        }
        this.scorePopups = this.scorePopups.filter(p => p.life > 0);
    }

    addFloatingText(text, x, y, color = '#ffffff', size = 14) {
        this.floatingTexts.push({
            text: text,
            x: x,
            y: y,
            color: color,
            size: size,
            alpha: 1,
            life: 2,
            vy: -20
        });
    }

    updateFloatingTexts(dt) {
        for (const t of this.floatingTexts) {
            t.y += t.vy * dt;
            t.life -= dt;
            t.alpha = Math.min(1, t.life / 0.5);
        }
        this.floatingTexts = this.floatingTexts.filter(t => t.life > 0);
    }

    screenShake(intensity, duration) {
        const startTime = performance.now();
        const originalMargin = this.canvas.style.margin;
        
        const shake = () => {
            const elapsed = performance.now() - startTime;
            if (elapsed < duration) {
                const progress = elapsed / duration;
                const currentIntensity = intensity * (1 - progress);
                const dx = (Math.random() - 0.5) * currentIntensity * 2;
                const dy = (Math.random() - 0.5) * currentIntensity * 2;
                this.canvas.style.transform = `translate(${dx}px, ${dy}px)`;
                requestAnimationFrame(shake);
            } else {
                this.canvas.style.transform = 'none';
            }
        };
        
        shake();
    }

    updateConnectionStatus(status) {
        this.connectionStatusEl.textContent = status;
    }
}

window.onload = () => {
    window.game = new Game();
};
