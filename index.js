const { Telegraf } = require('telegraf');
const express = require('express');

const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);
const app = express();

let botActivated = false;
let selectedEmoji = null;

// Allowed emojis
const allowedEmojis = [
  '❤️‍🔥','❤️','🗿','😭','🙏🏼','🫡','💯','👀','🆒','🥰','😍','😐',
  '🤩','😎','😇','👾','🕊️','🎃','🐳','🏆','🤝','✍🏼','👨🏼‍💻',
  '💋','🤣','⚡','🔥','☃️','🦄','💘','👻','💊','🌚','🎉','🥴'
];

// Start command (/rk)
bot.command('rk', async (ctx) => {
  try {
    botActivated = true;
    await ctx.reply(
      "Welcome! I'm Auto Reaction Bot For Telegram Channel's\n\n" +
      "• Join D channel : @HisElysium4 😋\n\n" +
      "Send an emoji to choose a reaction, then forward a post or send a post link like:\n" +
      "https://t.me/YourChannel/123"
    );
  } catch (e) {
    console.error("rk error:", e);
  }
});

// Emoji selection
bot.on('text', async (ctx) => {
  if (!botActivated) return;

  const text = ctx.message.text;

  if (allowedEmojis.includes(text)) {
    selectedEmoji = text;
    return ctx.reply(`✅ Reaction emoji set to: ${selectedEmoji}`);
  }
});

// Main message handler
bot.on('message', async (ctx) => {
  if (!botActivated || !selectedEmoji) return;

  try {
    const msg = ctx.message;

    // CASE 1: Forwarded channel post
    if (
      msg.forward_from_chat &&
      msg.forward_from_chat.type === 'channel' &&
      msg.forward_from_message_id
    ) {
      await ctx.telegram.setMessageReaction(
        msg.forward_from_chat.id,
        msg.forward_from_message_id,
        [{ type: 'emoji', emoji: selectedEmoji }]
      );

      return ctx.reply(`✅ Reacted with: ${selectedEmoji}`);
    }

    // CASE 2: Telegram post link
    if (msg.text) {
      const match = msg.text.match(/https:\/\/t\.me\/([\w\d_]+)\/(\d+)/);

      if (match) {
        const username = match[1];
        const messageId = Number(match[2]);

        const chat = await ctx.telegram.getChat(`@${username}`);

        await ctx.telegram.setMessageReaction(
          chat.id,
          messageId,
          [{ type: 'emoji', emoji: selectedEmoji }]
        );

        return ctx.reply(`✅ Reacted to post link with: ${selectedEmoji}`);
      }
    }

    await ctx.reply("❗Please forward a channel post or send a valid post link.");

  } catch (error) {
    console.error("Reaction error:", error);
    await ctx.reply("❌ Failed to react. Make sure the bot is admin & reactions are enabled.");
  }
});

/* =========================
   RENDER WEBHOOK SETUP
========================= */

app.use(express.json());

app.post(`/bot${BOT_TOKEN}`, (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Bot running on Render");
});
