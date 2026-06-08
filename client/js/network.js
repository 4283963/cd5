class NetworkManager {
    constructor() {
        this.ws = null;
        this.connected = false;
        this.playerId = null;
        this.messageHandlers = {};
        this.pingStartTime = 0;
        this.ping = 0;
        this.serverURL = 'ws://localhost:8080/ws';
    }

    connect(playerName) {
        return new Promise((resolve, reject) => {
            try {
                const ws = new WebSocket(this.serverURL);
                
                ws.onopen = () => {
                    console.log('[Network] Connected to server');
                    this.connected = true;
                    this.ws = ws;
                    
                    this.send({
                        type: 'join',
                        name: playerName
                    });
                    
                    this.startPing();
                };
                
                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleMessage(data);
                    } catch (e) {
                        console.error('[Network] Parse error:', e);
                    }
                };
                
                ws.onclose = () => {
                    console.log('[Network] Disconnected from server');
                    this.connected = false;
                    this.trigger('disconnect', {});
                };
                
                ws.onerror = (error) => {
                    console.error('[Network] Error:', error);
                    reject(error);
                };
                
                this.on('welcome', (data) => {
                    this.playerId = data.playerId;
                    console.log('[Network] Got player ID:', this.playerId);
                    resolve(this.playerId);
                });
                
            } catch (e) {
                reject(e);
            }
        });
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            this.connected = false;
        }
    }

    send(data) {
        if (!this.connected || !this.ws) {
            return false;
        }
        try {
            this.ws.send(JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('[Network] Send error:', e);
            return false;
        }
    }

    handleMessage(data) {
        if (data.type && this.messageHandlers[data.type]) {
            this.messageHandlers[data.type](data);
        } else {
            console.log('[Network] Unhandled message:', data.type);
        }
    }

    on(type, handler) {
        this.messageHandlers[type] = handler;
    }

    trigger(type, data) {
        if (this.messageHandlers[type]) {
            this.messageHandlers[type](data);
        }
    }

    startPing() {
        setInterval(() => {
            if (this.connected) {
                this.pingStartTime = Date.now();
                this.send({ type: 'ping' });
            }
        }, 3000);

        this.on('pong', () => {
            this.ping = Date.now() - this.pingStartTime;
            this.trigger('pingUpdate', { ping: this.ping });
        });
    }

    sendInput(inputData) {
        this.send({
            type: 'input',
            ...inputData
        });
    }

    sendShoot(localBulletId) {
        const msg = {
            type: 'shoot'
        };
        if (localBulletId) {
            msg.localBulletId = localBulletId;
        }
        this.send(msg);
    }

    getPing() {
        return this.ping;
    }

    isConnected() {
        return this.connected;
    }

    getPlayerId() {
        return this.playerId;
    }
}
