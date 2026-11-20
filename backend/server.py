"""
Jarvis Telegram Bot - Backend
A real-time ecosystem of AI agents working together.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
import asyncio
import json
import random
from datetime import datetime

app = FastAPI()

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.agents: Dict[str, Dict] = {}
        self.missions: List[Dict] = []
        self.history: List[Dict] = []
        self.conversations: List[Dict] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

    def init_agents(self):
        """Initialize the three agents."""
        self.agents = {
            "robot": {
                "id": "robot",
                "name": "Robot",
                "role": "Chercheur",
                "emoji": "🤖",
                "color": "#B87333",
                "status": "idle",
                "x": 100,
                "y": 150,
                "current_task": None,
                "skills": ["recherche_web", "analyse_concurrence", "veille_opportunites"],
                "personality": "Logique, précis, sarcastique"
            },
            "gobelin": {
                "id": "gobelin",
                "name": "Gobelin",
                "role": "Rédacteur",
                "emoji": "👺",
                "color": "#39FF14",
                "status": "idle",
                "x": 300,
                "y": 150,
                "current_task": None,
                "skills": ["redaction", "creation_contenu", "seo"],
                "personality": "Farceur, rusé, blagueur"
            },
            "serpent": {
                "id": "serpent",
                "name": "Serpent",
                "role": "Analyste",
                "emoji": "🐍",
                "color": "#FF1493",
                "status": "idle",
                "x": 500,
                "y": 150,
                "current_task": None,
                "skills": ["analyse_financiere", "roi", "previsions"],
                "personality": "Froid, calculateur, hypnotique"
            }
        }

        # Add initial history
        self.history = [
            {
                "timestamp": datetime.now().isoformat(),
                "agent_name": "Système",
                "content": "🌐 Écosystème Jarvis initialisé. 3 agents prêts."
            }
        ]

manager = ConnectionManager()

# Serve frontend
app.mount("/static", StaticFiles(directory="../frontend"), name="static")

@app.get("/")
async def get_index():
    with open("../frontend/index.html") as f:
        return HTMLResponse(f.read())

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    
    # Initialize agents
    manager.init_agents()
    
    try:
        # Send initial data
        await websocket.send_json({
            "type": "agents",
            "agents": list(manager.agents.values())
        })
        
        await websocket.send_json({
            "type": "history",
            "history": manager.history
        })
        
        while True:
            data = await websocket.receive_json()
            await handle_websocket_message(websocket, data)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)

async def handle_websocket_message(websocket: WebSocket, data: dict):
    """Handle incoming WebSocket messages."""
    
    if data["type"] == "get_agents":
        await websocket.send_json({
            "type": "agents",
            "agents": list(manager.agents.values())
        })
    
    elif data["type"] == "get_history":
        await websocket.send_json({
            "type": "history",
            "history": manager.history
        })
    
    elif data["type"] == "create_mission":
        mission = data["mission"]
        
        # Add mission to queue
        manager.missions.append(mission)
        
        # Assign to agent
        agent_id = mission["agent"]
        agent = manager.agents.get(agent_id)
        
        if agent:
            # Update agent status
            agent["status"] = "working"
            agent["current_task"] = mission["text"]
            
            # Broadcast agent update
            await manager.broadcast({
                "type": "agent_update",
                "agent": agent
            })
            
            # Add conversation
            conversation = {
                "id": f"conv_{len(manager.conversations)}",
                "agent_id": agent_id,
                "agent_name": agent["name"],
                "message": f"📋 Mission reçue: {mission['text']}",
                "x": agent["x"],
                "y": agent["y"] - 80,
                "status": "working",
                "timestamp": datetime.now().isoformat()
            }
            manager.conversations.append(conversation)
            
            await manager.broadcast({
                "type": "conversation",
                "conversation": conversation
            })
            
            # Add to history
            history_item = {
                "timestamp": datetime.now().isoformat(),
                "agent_name": agent["name"],
                "content": f"📋 Mission: {mission['text']}"
            }
            manager.history.append(history_item)
            
            await manager.broadcast({
                "type": "history",
                "history": manager.history
            })
            
            # Start working on mission
            asyncio.create_task(simulate_agent_work(agent_id, mission))

async def simulate_agent_work(agent_id: str, mission: dict):
    """Simulate agent working on a mission."""
    
    agent = manager.agents[agent_id]
    
    # Simulate work phases
    phases = [
        ("🔍 Analyse de la demande...", 2),
        ("📊 Recherche d'informations...", 3),
        ("⚙️ Traitement des données...", 3),
        ("✅ Mission terminée!", 1)
    ]
    
    for phase, duration in phases:
        await asyncio.sleep(duration)
        
        # Update conversation
        conversation = {
            "id": f"conv_{len(manager.conversations)}",
            "agent_id": agent_id,
            "agent_name": agent["name"],
            "message": phase,
            "x": agent["x"],
            "y": agent["y"] - 80,
            "status": "working",
            "timestamp": datetime.now().isoformat()
        }
        manager.conversations.append(conversation)
        
        await manager.broadcast({
            "type": "conversation",
            "conversation": conversation
        })
        
        # Add to history
        history_item = {
            "timestamp": datetime.now().isoformat(),
            "agent_name": agent["name"],
            "content": phase
        }
        manager.history.append(history_item)
        
        await manager.broadcast({
            "type": "history",
            "history": manager.history
        })
    
    # Mark mission complete
    agent["status"] = "idle"
    agent["current_task"] = None
    
    await manager.broadcast({
        "type": "agent_update",
        "agent": agent
    })
    
    # Add completion message
    completion_message = f"✅ Mission terminée: {mission['text']}"
    
    conversation = {
        "id": f"conv_{len(manager.conversations)}",
        "agent_id": agent_id,
        "agent_name": agent["name"],
        "message": completion_message,
        "x": agent["x"],
        "y": agent["y"] - 80,
        "status": "complete",
        "timestamp": datetime.now().isoformat()
    }
    manager.conversations.append(conversation)
    
    await manager.broadcast({
        "type": "conversation",
        "conversation": conversation
    })
    
    # Add to history
    history_item = {
        "timestamp": datetime.now().isoformat(),
        "agent_name": agent["name"],
        "content": completion_message
    }
    manager.history.append(history_item)
    
    await manager.broadcast({
        "type": "history",
        "history": manager.history
    })

@app.get("/api/agents")
async def get_agents():
    return {"agents": list(manager.agents.values())}

@app.get("/api/missions")
async def get_missions():
    return {"missions": manager.missions}

@app.get("/api/history")
async def get_history():
    return {"history": manager.history}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)