# Jarvis Telegram Ecosystem

Un écosystème virtuel en temps réel où vos agents IA travaillent ensemble.

## Structure

```
jarvis-telegram/
├── backend/
│   ├── server.py      # FastAPI + WebSocket
│   └── bot.py         # Telegram Bot
├── frontend/
│   ├── index.html     # Mini App
│   ├── css/
│   │   └── style.css  # Styles
│   └── js/
│       └── app.js     # Logique frontend
└── requirements.txt
```

## Installation

```bash
pip install fastapi uvicorn python-telegram-bot
```

## Configuration

1. Créer un bot Telegram via @BotFather
2. Configurer le token dans les variables d'environnement
3. Déployer le serveur backend
4. Configurer l'URL de la Mini App

## Utilisation

1. Ouvrir Telegram
2. Lancer le bot avec /start
3. Cliquer sur "Ouvrir l'Écosystème"
4. Voir les agents travailler en temps réel

## Agents

- 🤖 **Robot** - Chercheur (recherche web, analyse)
- 👺 **Gobelin** - Rédacteur (contenu, SEO)
- 🐍 **Serpent** - Analyste (finance, ROI)

## Fonctionnalités

- Temps réel (WebSocket)
- Agents animés
- Conversations en direct
- Missions
- Historique
- Status des agents