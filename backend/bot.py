"""
Jarvis Telegram Bot - Bot setup
"""

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
import os

# Bot token from environment variable
BOT_TOKEN = "9093745263:AAE1el0EJGaT2Tau5bWMIrMV_kYApim2nwc"
MINI_APP_URL = "https://nidnorg.github.io/jarvis-ecosystem/"

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Send a welcome message with Mini App button."""
    
    keyboard = [
        [InlineKeyboardButton("🌐 Ouvrir l'Écosystème", web_app=WebAppInfo(url=MINI_APP_URL))],
        [InlineKeyboardButton("📊 Mes Agents", callback_data="show_agents")],
        [InlineKeyboardButton("📜 Historique", callback_data="show_history")]
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "🤖 Bienvenue dans l'écosystème Jarvis!\n\n"
        "Vos agents IA travaillent ensemble pour vous.\n"
        "Ouvrez l'écosystème pour voir ce qu'ils font en temps réel.",
        reply_markup=reply_markup
    )

async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle button callbacks."""
    
    query = update.callback_query
    await query.answer()
    
    if query.data == "show_agents":
        # Show agents status
        agents_text = (
            "📊 *Statut des Agents*\n\n"
            "🤖 Robot - Chercheur\n"
            "👺 Gobelin - Rédacteur\n"
            "🐍 Serpent - Analyste\n\n"
            "Ouvrez l'écosystème pour voir les détails."
        )
        await query.edit_message_text(text=agents_text, parse_mode="Markdown")
    
    elif query.data == "show_history":
        # Show recent history
        history_text = (
            "📜 *Historique récent*\n\n"
            "Ouvrez l'écosystème pour voir tout l'historique."
        )
        await query.edit_message_text(text=history_text, parse_mode="Markdown")

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Send help message."""
    
    help_text = (
        "🤖 *Jarvis Ecosystem Bot*\n\n"
        "Commandes disponibles:\n"
        "/start - Démarrer le bot\n"
        "/help - Aide\n"
        "/ecosystem - Ouvrir l'écosystème\n\n"
        "L'écosystème Jarvis est un monde virtuel où vos agents IA travaillent ensemble."
    )
    
    await update.message.reply_text(help_text, parse_mode="Markdown")

async def ecosystem_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Open the ecosystem Mini App."""
    
    keyboard = [
        [InlineKeyboardButton("🌐 Ouvrir l'Écosystème", web_app=WebAppInfo(url=MINI_APP_URL))]
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "🌐 Ouvrez l'écosystème Jarvis:",
        reply_markup=reply_markup
    )

def main():
    """Start the bot."""
    
    # Create application
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Add handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("ecosystem", ecosystem_command))
    application.add_handler(CallbackQueryHandler(button_handler))
    
    # Start bot
    print("🤖 Jarvis Ecosystem Bot started...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()