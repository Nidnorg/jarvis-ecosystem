// Jarvis Telegram Mini App - Main Application

class JarvisApp {
    constructor() {
        this.ws = null;
        this.agents = [];
        this.missions = [];
        this.history = [];
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.agentsContainer = document.getElementById('agent-labels');
        this.conversationsContainer = document.getElementById('conversations');

        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.connectWebSocket();
        this.loadInitialData();
        this.animate();
    }

    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }

    setupEventListeners() {
        // Mission button
        document.getElementById('btn-add-mission').addEventListener('click', () => {
            document.getElementById('mission-modal').classList.remove('hidden');
        });

        // Cancel mission
        document.getElementById('btn-cancel-mission').addEventListener('click', () => {
            document.getElementById('mission-modal').classList.add('hidden');
        });

        // Send mission
        document.getElementById('btn-send-mission').addEventListener('click', () => {
            this.sendMission();
        });

        // Mission input - Enter key
        document.getElementById('mission-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMission();
            }
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            document.getElementById('status').textContent = 'Connecté';
            document.getElementById('status').className = 'status connected';
            this.requestInitialData();
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            document.getElementById('status').textContent = 'Déconnecté';
            document.getElementById('status').className = 'status disconnected';

            // Reconnect after 3 seconds
            setTimeout(() => this.connectWebSocket(), 3000);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    handleMessage(data) {
        switch (data.type) {
            case 'agents':
                this.agents = data.agents;
                this.renderAgents();
                break;

            case 'agent_update':
                this.updateAgent(data.agent);
                break;

            case 'conversation':
                this.addConversation(data.conversation);
                break;

            case 'mission':
                this.addMission(data.mission);
                break;

            case 'history':
                this.history = data.history;
                this.renderHistory();
                break;

            case 'agent_action':
                this.showAgentAction(data.agent, data.action);
                break;
        }
    }

    requestInitialData() {
        this.ws.send(JSON.stringify({
            type: 'get_agents'
        }));

        this.ws.send(JSON.stringify({
            type: 'get_history'
        }));
    }

    loadInitialData() {
        // Load agents from Telegram WebApp
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.ready();
            window.Telegram.WebApp.expand();

            const user = window.Telegram.WebApp.initDataUnsafe?.user;
            if (user) {
                console.log('User:', user.first_name);
            }
        }

        // Create initial agents
        this.agents = [
            { id: 'robot', name: 'Robot', role: 'Chercheur', status: 'idle', x: 100, y: 150, color: '#B87333', emoji: '🤖' },
            { id: 'gobelin', name: 'Gobelin', role: 'Rédacteur', status: 'idle', x: 300, y: 150, color: '#39FF14', emoji: '👺' },
            { id: 'serpent', name: 'Serpent', role: 'Analyste', status: 'idle', x: 500, y: 150, color: '#FF1493', emoji: '🐍' }
        ];

        this.renderAgents();
    }

    sendMission() {
        const input = document.getElementById('mission-input');
        const missionText = input.value.trim();

        if (!missionText) return;

        const mission = {
            id: Date.now(),
            text: missionText,
            agent: this.selectRandomAgent(),
            status: 'pending',
            timestamp: new Date().toISOString()
        };

        this.ws.send(JSON.stringify({
            type: 'create_mission',
            mission: mission
        }));

        input.value = '';
        document.getElementById('mission-modal').classList.add('hidden');

        // Show notification
        this.showNotification(`Mission donnée à ${mission.agent}`);
    }

    selectRandomAgent() {
        const availableAgents = this.agents.filter(a => a.status === 'idle');
        if (availableAgents.length === 0) return this.agents[0];
        return availableAgents[Math.floor(Math.random() * availableAgents.length)];
    }

    renderAgents() {
        this.agentsContainer.innerHTML = '';

        this.agents.forEach(agent => {
            const label = document.createElement('div');
            label.className = `agent-label ${agent.status}`;
            label.style.left = `${agent.x}px`;
            label.style.top = `${agent.y}px`;
            label.innerHTML = `${agent.emoji} ${agent.name}<br><small>${agent.role}</small>`;

            label.addEventListener('click', () => {
                this.showAgentDetails(agent);
            });

            this.agentsContainer.appendChild(label);
        });
    }

    updateAgent(agentData) {
        const index = this.agents.findIndex(a => a.id === agentData.id);
        if (index !== -1) {
            this.agents[index] = { ...this.agents[index], ...agentData };
            this.renderAgents();
        }
    }

    addConversation(conversation) {
        const bubble = document.createElement('div');
        bubble.className = `conversation-bubble ${conversation.status}`;
        bubble.style.left = `${conversation.x}px`;
        bubble.style.top = `${conversation.y}px`;
        bubble.innerHTML = `
            <strong>${conversation.agent_name}:</strong> ${conversation.message}
        `;

        this.conversationsContainer.appendChild(bubble);

        // Remove after 5 seconds
        setTimeout(() => {
            bubble.style.opacity = '0';
            bubble.style.transition = 'opacity 0.5s';
            setTimeout(() => bubble.remove(), 500);
        }, 5000);
    }

    showAgentAction(agent, action) {
        this.showNotification(`${agent.name} ${action}`);
    }

    showNotification(message) {
        // Create notification
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--panel);
            border: 2px solid var(--cyan);
            padding: 12px 20px;
            border-radius: 20px;
            z-index: 1000;
            animation: slide-up 0.3s;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    addMission(mission) {
        this.missions.push(mission);
        this.renderHistory();
    }

    switchView(view) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        // Hide all panels
        document.querySelectorAll('.panel').forEach(panel => {
            panel.classList.add('hidden');
        });

        // Show selected view
        if (view === 'ecosystem') {
            document.getElementById('ecosystem').style.display = 'block';
        } else if (view === 'status') {
            document.getElementById('ecosystem').style.display = 'none';
            document.getElementById('status-panel').classList.remove('hidden');
            this.renderStatus();
        } else if (view === 'history') {
            document.getElementById('ecosystem').style.display = 'none';
            document.getElementById('history-panel').classList.remove('hidden');
            this.renderHistory();
        }
    }

    renderStatus() {
        const container = document.getElementById('agent-status-list');
        container.innerHTML = '';

        this.agents.forEach(agent => {
            const item = document.createElement('div');
            item.className = `agent-status-item ${agent.status}`;
            item.innerHTML = `
                <h3>${agent.emoji} ${agent.name}</h3>
                <p>Rôle: ${agent.role}</p>
                <p>Statut: ${agent.status === 'working' ? '🟢 Au travail' : '⚪ Inactif'}</p>
                ${agent.current_task ? `<p class="task">📋 ${agent.current_task}</p>` : ''}
            `;
            container.appendChild(item);
        });
    }

    renderHistory() {
        const container = document.getElementById('history-list');
        container.innerHTML = '';

        this.history.slice().reverse().forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="time">${new Date(item.timestamp).toLocaleString('fr-FR')}</div>
                <div class="content">${item.content}</div>
                <div class="agent">${item.agent_name}</div>
            `;
            container.appendChild(historyItem);
        });
    }

    animate() {
        this.draw();
        requestAnimationFrame(() => this.animate());
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw connections between agents
        this.agents.forEach((agent, i) => {
            this.agents.slice(i + 1).forEach(otherAgent => {
                const distance = this.getDistance(agent, otherAgent);

                if (distance < 200) {
                    this.ctx.strokeStyle = `rgba(0, 229, 255, ${1 - distance / 200})`;
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(agent.x + 50, agent.y + 50);
                    this.ctx.lineTo(otherAgent.x + 50, otherAgent.y + 50);
                    this.ctx.stroke();
                }
            });
        });

        // Draw agent circles
        this.agents.forEach(agent => {
            this.ctx.beginPath();
            this.ctx.arc(agent.x + 50, agent.y + 50, 40, 0, Math.PI * 2);
            this.ctx.fillStyle = agent.color;
            this.ctx.globalAlpha = 0.3;
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
            this.ctx.strokeStyle = agent.color;
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            // Draw emoji
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(agent.emoji, agent.x + 50, agent.y + 50);
        });
    }

    getDistance(agent1, agent2) {
        const dx = agent1.x - agent2.x;
        const dy = agent1.y - agent2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    showAgentDetails(agent) {
        const details = `
            ${agent.emoji} ${agent.name}
            Rôle: ${agent.role}
            Statut: ${agent.status}
            ${agent.current_task ? `Tâche actuelle: ${agent.current_task}` : ''}
        `;
        alert(details);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.jarvisApp = new JarvisApp();
});