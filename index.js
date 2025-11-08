import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

/************************************************
 * Telegram Poker Tournament Bot - Webhook (Node.js)
 ************************************************/

// טוקן של הבוט שלך
const BOT_TOKEN = "8142647492:AAFLz8UkeXHqS2LCH2Emi3Quktu8nCyzGUQ";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const app = express();
app.use(bodyParser.json());

const chatStates = new Map();

/************************************************
 * פונקציות עזר בסיסיות
 ************************************************/
function sendMessage(chatId, text, parseMode = "HTML") {
  return fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
  });
}

function loadState(chatId) {
  if (!chatStates.has(chatId)) {
    chatStates.set(chatId, {
      step: "START",
      chatId,
      winners: [],
      remainingPlayers: [],
    });
  }
  return chatStates.get(chatId);
}

function saveState(state) {
  chatStates.set(state.chatId, state);
}

function resetState(chatId) {
  chatStates.delete(chatId);
}

/************************************************
 * חישוב אחוזי זכייה
 ************************************************/
function getPrizePercents(numPlayers) {
  if (numPlayers >= 2 && numPlayers <= 5) return [100];
  if (numPlayers >= 6 && numPlayers <= 9) return [65, 35];
  if (numPlayers >= 10 && numPlayers <= 15) return [50, 30, 20];
  if (numPlayers >= 16 && numPlayers <= 22) return [45, 27, 18, 10];
  if (numPlayers >= 23 && numPlayers <= 29) return [42, 25, 16, 10, 7];
  if (numPlayers >= 30 && numPlayers <= 35) return [38, 23, 16, 10, 7, 6];
  if (numPlayers >= 36 && numPlayers <= 40) return [35, 22, 15, 10, 7, 6, 5];
  if (numPlayers >= 41 && numPlayers <= 47)
    return [32, 21, 15, 10, 7, 6, 5, 4];
  if (numPlayers >= 48 && numPlayers <= 56)
    return [30, 20, 14, 9, 7, 6, 5, 5, 4];
  if (numPlayers >= 57) return [28, 19, 14, 9, 7, 6, 5, 5, 4, 3];
  return [100];
}

/************************************************
 * שלבים ותהליכי שיחה
 ************************************************/
function sendWelcome(chatId) {
  const text =
    "התחיל חישוב זכיות חדש.\n" +
    "מה שם הפייבוקס? (אם לא יודע, אפשר לכתוב /דלג)";
  sendMessage(chatId, text);
}

function handleMessage(chatId, text) {
  const trimmed = (text || "").trim();
  let state = loadState(chatId);

  if (trimmed === "/start") {
    resetState(chatId);
    state = loadState(chatId);
    sendWelcome(chatId);
    state.step = "ASK_PAYBOX";
    saveState(state);
    return;
  }

  switch (state.step) {
    case "ASK_PAYBOX":
      handlePayboxInput(state, trimmed);
      break;
    case "ASK_PLAYERS":
      handlePlayersCountInput(state, trimmed);
      break;
    case "ASK_BUYIN":
      handleBuyInInput(state, trimmed);
      break;
    case "ASK_DEAL_COUNT":
      handleDealCountInput(state, trimmed);
      break;
    case "ASK_WINNERS":
      handleWinnersInput(state, trimmed);
      break;
    default:
      sendWelcome(chatId);
      state.step = "ASK_PAYBOX";
      saveState(state);
      break;
  }
}

function handlePayboxInput(state, text) {
  const chatId = state.chatId;
  const lower = text.toLowerCase();

  if (
    text.length === 0 ||
    (text.startsWith("/") && (lower.includes("דלג") || lower.includes("skip")))
  ) {
    state.payboxName = null;
  } else {
    state.payboxName = text;
  }

  state.step = "ASK_PLAYERS";
  saveState(state);

  sendMessage(chatId, "כמה שחקנים היו בטורניר?");
}

function handlePlayersCountInput(state, text) {
  const chatId = state.chatId;
  const num = parseInt(text);
  if (isNaN(num) || num < 2) {
    sendMessage(chatId, "נא להזין מספר שחקנים תקין (לפחות 2).");
    return;
  }
  state.numPlayers = num;
  state.step = "ASK_BUYIN";
  saveState(state);
  sendMessage(chatId, "מה סכום הכניסה (בשקלים)?");
}

function handleBuyInInput(state, text) {
  const chatId = state.chatId;
  const num = parseInt(text);
  if (isNaN(num) || num <= 0) {
    sendMessage(chatId, "נא להזין סכום כניסה תקין (במספרים).");
    return;
  }
  state.buyIn = num;
  state.step = "ASK_DEAL_COUNT";
  saveState(state);
  sendMessage(chatId, "האם היה דיל? אם כן, כמה מהזוכים היו בדיל? אם לא, כתוב 0.");
}

function handleDealCountInput(state, text) {
  const chatId = state.chatId;
  const num = parseInt(text);
  state.deal = num > 0;
  state.dealCount = num;
  saveState(state);
  state.step = "ASK_WINNERS";
  sendMessage(chatId, "הזן את הזוכים לפי הסדר (למשל: אבי, ברק, רונן).");
}

function handleWinnersInput(state, text) {
  const chatId = state.chatId;
  const winners = text
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  if (!winners.length) {
    sendMessage(chatId, "נא להזין לפחות שם אחד.");
    return;
  }

  state.winners = winners.map((name, i) => ({
    place: i + 1,
    nickname: name,
  }));

  finalizeResults(state);
}

/************************************************
 * חישוב וסיכום תוצאות
 ************************************************/
function finalizeResults(state) {
  const chatId = state.chatId;
  const winners = state.winners || [];
  const numPlayers = state.numPlayers || 0;
  const buyIn = state.buyIn || 0;

  const totalPot = numPlayers * buyIn;
  const percents = getPrizePercents(numPlayers);

  const prizesBase = percents.map(p => Math.round((totalPot * p) / 100));
  let prizesFinal = prizesBase.slice();

  if (state.deal && state.dealCount && state.dealCount > 1) {
    prizesFinal = applyDeal(prizesBase, state.dealCount);
  }

  const lines = [];
  lines.push("🔥 סיכום הטילט היומי:\n");

  if (state.payboxName) {
    lines.push("שם פייבוקס: " + state.payboxName);
  } else {
    lines.push("שם פייבוקס: לא צוין");
  }

  lines.push("מספר שחקנים: " + numPlayers);
  lines.push("סכום כניסה: " + buyIn + "₪");

  if (state.deal && state.dealCount && state.dealCount > 1)
    lines.push("דיל: כן - חלקי (" + state.dealCount + " מתוך הזוכים)");
  else if (state.deal) lines.push("דיל: כן");
  else lines.push("דיל: לא");

  lines.push("\n🏆 טבלת זכיות:\n");

  const medalByPlace = place => {
    if (place === 1) return "👑";
    if (place === 2) return "🥈";
    if (place === 3) return "🥉";
    return "🏅";
  };

  winners.forEach((w, i) => {
    const place = w.place;
    const name = w.nickname;
    const amount = prizesFinal[i] || 0;
    const dealTag =
      state.deal && state.dealCount && place <= state.dealCount
        ? " (בדיל)"
        : "";
    lines.push(`${medalByPlace(place)} מקום ${place} - ${name} - ${amount}₪${dealTag}`);
  });

  lines.push("\nברכות לזוכים! 🎉");

  const summaryText = lines.join("\n");
  const waUrl =
    "https://api.whatsapp.com/send?text=" + encodeURIComponent(summaryText);
  const finalMessage =
    summaryText + `\n\n🔗 <a href="${waUrl}">שיתוף בוואטסאפ</a>`;

  sendMessage(chatId, finalMessage);
  resetState(chatId);
}

function applyDeal(prizes, count) {
  const sum = prizes.slice(0, count).reduce((a, b) => a + b, 0);
  const avg = Math.round(sum / count);
  const newPrizes = prizes.slice();
  for (let i = 0; i < count; i++) newPrizes[i] = avg;
  return newPrizes;
}

/************************************************
 * Webhook
 ************************************************/
app.post(`/webhook/${BOT_TOKEN}`, async (req, res) => {
  const update = req.body;
  if (update.message) {
    const chatId = update.message.chat.id;
    const text = update.message.text;
    handleMessage(chatId, text);
  }
  res.sendStatus(200);
});

/************************************************
 * שרת רנדר
 ************************************************/
app.get("/", (req, res) => {
  res.send("Poker Telegram Bot is running");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
