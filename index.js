import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

/***************************************************
 * Telegram Poker Tournament Bot - Webhook (Node.js)
 ***************************************************/

// שים כאן את הטוקן של הבוט החדש שלך
const BOT_TOKEN = "8142647492:AAFLz8UkeXHqS2LCH2EmW3Quktu8nCyzGUQ";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const app = express();
app.use(bodyParser.json());

// state בזיכרון, לפי chatId
const chatStates = new Map();

/**
 * עזר - לקבל או ליצור state לפי chatId
 */
function loadState(chatId) {
  if (!chatStates.has(chatId)) {
    chatStates.set(chatId, {
      step: "START",
      chatId,
      winners: [],
      remainingPlayers: getAllNicknames()
    });
  }
  return chatStates.get(chatId);
}

function resetState(chatId) {
  chatStates.delete(chatId);
}

/**
 * שליחת הודעה
 */
async function sendMessage(chatId, text, extra) {
  const payload = {
    chat_id: String(chatId), // חשוב - מחרוזת
    text,
    parse_mode: "HTML",
    ...extra
  };

  console.log("sendMessage payload:", payload);

  try {
    const res = await axios.post(`${TELEGRAM_API}/sendMessage`, payload);
    return res.data;
  } catch (err) {
    console.error("Telegram sendMessage error:", err.response?.data || err.message);
  }
}

/**
 * תשובה ל callback query
 */
async function answerCallbackQuery(callbackQueryId, text) {
  const payload = {
    callback_query_id: callbackQueryId
  };
  if (text) {
    payload.text = text;
    payload.show_alert = false;
  }
  try {
    await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, payload);
  } catch (err) {
    console.error("answerCallbackQuery error:", err.response?.data || err.message);
  }
}

/**
 * עדכון reply_markup של הודעה (אם נצטרך)
 */
async function editMessageReplyMarkup(chatId, messageId, replyMarkup) {
  const payload = {
    chat_id: String(chatId),
    message_id: messageId,
    reply_markup: JSON.stringify(replyMarkup)
  };
  try {
    await axios.post(`${TELEGRAM_API}/editMessageReplyMarkup`, payload);
  } catch (err) {
    console.error("editMessageReplyMarkup error:", err.response?.data || err.message);
  }
}

/**
 * מיפוי nickname -> full name
 */
function getPlayersMap() {
  return {
    "avibil10": "אבי בן נעים",
    "Avico1985": "אבי כהן",
    "Elinuts8": "אלירן חרפוף",
    "oranit2310": "אורנית קהתי",
    "ialush": "אילן אלוש",
    "heavy lion": "אילן קדוש",
    "2GRAND": "אלדר",
    "AA50100": "אריאל ענבי",
    "Ariking50": "אריק כהן",
    "ROBOTRIK": "ארז אטיאס",
    "Erni99": "ארז ניצן",
    "dorshay": "אשר",
    "bingotime001": "ברק אוחיון",
    "FLASH28": "ברק חן",
    "benran888": "בני רן",
    "raptor0102": "נדב יהב",
    "galit1985": "גלית תבורי",
    "KINGDUDIS": "דודיקור",
    "Dave55": "דויד רימה",
    "Kdror": "דרור קהתי",
    "Totach711": "זיו מדור",
    "maoz310": "חביב מעוז",
    "Bargig": "חיים ברגיג",
    "TovaAce": "טובה פומברג",
    "yosi_g": "יוסי גדסי",
    "Yossi maimon": "יוסי מיימון",
    "yechiel200": "יחיאל בירארוב",
    "jacks0706": "יעקב אלוש",
    "ifataa": "יפעת לוי",
    "superbot99": "ירון כהן",
    "liavakiva": "ליאב כהן",
    "L-A36": "ליאור עמוס",
    "Darkcrypto": "ליאור",
    "RealDude": "לירן מזרחי",
    "liran1984": "לירן נהרי",
    "Maor BK": "מאור",
    "Kasperz": "זיו המילשטיין",
    "morimori": "מורן בן סיניור",
    "meni79": "מני",
    "Meron 2010": "מרון",
    "Chorisos": "מתן צסלריס",
    "Inbar23": "נוי יוסף",
    "Noams4": "נועם",
    "H!ghSn[j@ck]": "ניב",
    "galtraveler1": "עומר גל",
    "omerlevy": "עומר לוי",
    "rochman2016!": "לי רוכמן",
    "basilstein": "עידן באסל",
    "Acecharm": "עידן כץ",
    "ek2404": "עינב קהתי",
    "arsenal1": "עמנואל",
    "Amimesika": "עמי מסיקה",
    "Anat Harari!": "ענת כץ",
    "Vecliko": "ערן בוזי",
    "Theriverfish777": "צחי זילברליכט",
    "IDFSARGE50": "צחי חמישה",
    "Tzahina23": "צחי נגר",
    "p9936-3854": "ציפי סנדי",
    "runit1s": "רומן גלפרין",
    "Romilevy123455": "רומי לוי",
    "ntsh87": "נתנאל",
    "tiger0402": "רוני זינגר",
    "ron131": "רונן שוורץ",
    "Ronenking": "רונן פנקר",
    "Roy Maman": "רועי ממן",
    "sagitr": "שגית רובנשטיין",
    "shOval": "שובל",
    "shahar1980": "שחר קהתי",
    "scarf-Ace7": "שי בוחבוט",
    "niro112": "ניר עבדוש",
    "ami89": "עמי הלר",
    "Blueman24": "שי נגר",
    "Shaystam": "שי סטמקר",
    "shay1975": "שי מאיו",
    "shuli3107": "שלומית יעקב",
    "Tomer1311": "תומר",
    "Gennua": "גני",
    "shirani": "שירן",
    "orly449": "ישראל",
    "talamar11": "טל עמר",
    "Rafiki55": "ניב עמר",
    "shlomy71": "שלומי",
    "alfam": "יובל מאיו",
    "The sky king": "נדב",
    "tald11": "טל דרף",
    "eliyashira": "אבירם",
    "ziony271082": "ציון",
    "ronius1": "רוני זילברמן",
    "dolev-itach": "דולב איטח",
    "Ys80": "יער סלומון",
    "kingtz1184": "צדוק",
    "ray12345": "רז חסון",
    "slypoker!": "אוהד",
    "eran14": "ערן"
  };
}

function getAllNicknames() {
  return Object.keys(getPlayersMap());
}

/**
 * אחוזי פרסים לפי מספר שחקנים
 */
function getPrizePercents(numPlayers) {
  if (numPlayers >= 2 && numPlayers <= 5) return [100];
  if (numPlayers >= 6 && numPlayers <= 9) return [65, 35];
  if (numPlayers >= 10 && numPlayers <= 15) return [50, 30, 20];
  if (numPlayers >= 16 && numPlayers <= 22) return [45, 27, 18, 10];
  if (numPlayers >= 23 && numPlayers <= 29) return [42, 25, 16, 10, 7];
  if (numPlayers >= 30 && numPlayers <= 35) return [38, 23, 16, 7, 6];
  if (numPlayers >= 36 && numPlayers <= 40) return [35, 22, 15, 7, 6, 5];
  if (numPlayers >= 41 && numPlayers <= 47) return [32, 21, 15, 7, 6, 5, 4];
  if (numPlayers >= 48 && numPlayers <= 56) return [30, 20, 14, 9, 7, 6, 5, 4];
  if (numPlayers >= 57) return [28, 19, 14, 9, 7, 6, 5, 4, 3];
  return [100];
}

/**
 * חישוב פרסים בסיסי
 */
function initPrizes(state) {
  const numPlayers = state.numPlayers;
  const buyIn = state.buyIn;
  const percents = getPrizePercents(numPlayers);
  const totalPot = numPlayers * buyIn;

  const prizes = [];
  let sum = 0;
  for (let i = 0; i < percents.length; i++) {
    const amount = Math.round((totalPot * percents[i]) / 100);
    prizes.push(amount);
    sum += amount;
  }

  const diff = Math.round(totalPot - sum);
  if (diff !== 0 && prizes.length > 0) {
    prizes[0] += diff;
  }

  state.prizesBase = prizes;
}

/**
 * יישום דיל על הפרסים
 */
function applyDeal(prizes, dealCount) {
  if (!dealCount || dealCount < 2) return prizes.slice();

  const result = prizes.slice();
  let sumDeal = 0;
  for (let i = 0; i < dealCount && i < result.length; i++) {
    sumDeal += result[i];
  }
  const evenShare = Math.floor(sumDeal / dealCount);
  let remainder = sumDeal - evenShare * dealCount;

  for (let j = 0; j < dealCount && j < result.length; j++) {
    result[j] = evenShare;
  }
  let k = 0;
  while (remainder > 0 && k < dealCount && k < result.length) {
    result[k]++;
    remainder--;
    k++;
  }
  return result;
}

/**
 * הודעת פתיחה
 */
async function sendWelcome(chatId) {
  const txt =
    "ברוך הבא לבוט חישוב זכיות בטורניר פוקר.\n\n" +
    "כמה שחקנים היו בטורניר?";
  await sendMessage(chatId, txt);
}

/**
 * בקשה לבחירת מנצח
 */
async function askForNextWinner(state) {
  const chatId = state.chatId;
  const place = state.currentPlace;
  const maxPlaces = state.prizesBase.length;

  if (place > maxPlaces) {
    await finalizeResults(state);
    return;
  }

  const players = state.remainingPlayers || getAllNicknames();
  if (!players || players.length === 0) {
    await finalizeResults(state);
    return;
  }

  const kb = buildPlayersKeyboard(players);
  const txt = `בחר את מקום ${place}:\nבחר ניק לפי סדר הסיום.`;

  await sendMessage(chatId, txt, {
    reply_markup: JSON.stringify(kb)
  });
}

/**
 * מקלדת אינליין של ניקניימים
 */
function buildPlayersKeyboard(players) {
  const keyboard = [];
  let row = [];
  for (let i = 0; i < players.length; i++) {
    row.push({
      text: players[i],
      callback_data: "WINNER|" + players[i]
    });
    if (row.length === 2) {
      keyboard.push(row);
      row = [];
    }
  }
  if (row.length > 0) keyboard.push(row);
  return { inline_keyboard: keyboard };
}

/**
 * טיפול בעדכון כללי
 */
async function handleUpdate(update) {
  if (update.message) {
    await handleMessage(update.message);
  } else if (update.callback_query) {
    await handleCallbackQuery(update.callback_query);
  }
}

/**
 * טיפול בהודעת טקסט
 */
async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const text = msg.text ? String(msg.text).trim() : "";
  let state = loadState(chatId);

  if (text === "/start") {
    resetState(chatId);
    state = loadState(chatId);
    await sendWelcome(chatId);
    state.step = "ASK_PLAYERS";
    return;
  }

  switch (state.step) {
    case "ASK_PLAYERS":
      await handlePlayersCountInput(state, text);
      break;
    case "ASK_BUYIN":
      await handleBuyInInput(state, text);
      break;
    case "ASK_DEAL_COUNT":
      await handleDealCountInput(state, text);
      break;
    default:
      await sendWelcome(chatId);
      state.step = "ASK_PLAYERS";
      break;
  }
}

/**
 * טיפול ב callback query
 */
async function handleCallbackQuery(cb) {
  const data = cb.data;
  const msg = cb.message;
  const chatId = msg.chat.id;
  let state = loadState(chatId);

  if (data === "START_FLOW") {
    resetState(chatId);
    state = loadState(chatId);
    await sendWelcome(chatId);
    state.step = "ASK_PLAYERS";
    await answerCallbackQuery(cb.id);
    return;
  }

  if (data === "DEAL_YES") {
    state.deal = true;
    state.step = "ASK_DEAL_COUNT";
    await answerCallbackQuery(cb.id);
    await sendMessage(chatId, "כמה שחקנים עשו דיל?");
    return;
  }

  if (data === "DEAL_NO") {
    state.deal = false;
    state.dealCount = 0;
    initPrizes(state);
    state.step = "SELECT_WINNERS";
    state.currentPlace = 1;
    state.winners = [];
    state.remainingPlayers = getAllNicknames();
    await answerCallbackQuery(cb.id);
    await askForNextWinner(state);
    return;
  }

  if (data && data.startsWith("WINNER|")) {
    const nick = data.split("|")[1];
    await handleWinnerSelection(state, nick, cb);
    return;
  }

  await answerCallbackQuery(cb.id);
}

/**
 * קבלת מספר שחקנים
 */
async function handlePlayersCountInput(state, text) {
  const chatId = state.chatId;
  const n = parseInt(text, 10);
  if (isNaN(n) || n < 2) {
    await sendMessage(chatId, "מספר שחקנים לא תקין. הזן מספר גדול או שווה ל 2.");
    return;
  }
  state.numPlayers = n;
  state.step = "ASK_BUYIN";
  await sendMessage(chatId, "מה היה סכום הכניסה בש\"ח?");
}

/**
 * קבלת ביי אין
 */
async function handleBuyInInput(state, text) {
  const chatId = state.chatId;
  const amount = parseFloat(String(text).replace(",", "."));
  if (isNaN(amount) || amount <= 0) {
    await sendMessage(chatId, "סכום כניסה לא תקין. הזן מספר חיובי.");
    return;
  }
  state.buyIn = amount;
  state.step = "ASK_DEAL";

  const kb = {
    inline_keyboard: [
      [
        { text: "כן", callback_data: "DEAL_YES" },
        { text: "לא", callback_data: "DEAL_NO" }
      ]
    ]
  };

  await sendMessage(chatId, "האם היה דיל?", {
    reply_markup: JSON.stringify(kb)
  });
}

/**
 * קבלת מספר משתתפים בדיל
 */
async function handleDealCountInput(state, text) {
  const chatId = state.chatId;
  const d = parseInt(text, 10);
  const maxPlaces = getPrizePercents(state.numPlayers).length;

  if (isNaN(d) || d < 2 || d > maxPlaces) {
    await sendMessage(
      chatId,
      "מספר שחקנים בדיל לא תקין. הזן מספר בין 2 ל " + maxPlaces + "."
    );
    return;
  }

  state.deal = true;
  state.dealCount = d;
  initPrizes(state);

  state.step = "SELECT_WINNERS";
  state.currentPlace = 1;
  state.winners = [];
  state.remainingPlayers = getAllNicknames();

  await sendMessage(chatId, "יש " + d + " שחקנים בדיל. בוא נבחר את המיקומים.");
  await askForNextWinner(state);
}

/**
 * טיפול בבחירת מנצח
 */
async function handleWinnerSelection(state, nickname, cb) {
  const chatId = state.chatId;
  const place = state.currentPlace;
  const players = state.remainingPlayers || getAllNicknames();

  const wArr = state.winners || [];
  if (wArr.find(w => w.nickname === nickname)) {
    await answerCallbackQuery(cb.id, "שחקן זה כבר נבחר.");
    return;
  }

  if (!players.includes(nickname)) {
    await answerCallbackQuery(cb.id, "שחקן לא קיים ברשימה.");
    return;
  }

  wArr.push({ place, nickname });
  state.winners = wArr;

  state.remainingPlayers = players.filter(p => p !== nickname);
  state.currentPlace = place + 1;

  await answerCallbackQuery(cb.id);
  await askForNextWinner(state);
}

/**
 * סיכום ושליחת וואטסאפ
 */
async function finalizeResults(state) {
  const chatId = state.chatId;
  const winners = state.winners || [];
  const prizesBase = state.prizesBase || [];
  let prizesFinal;

  if (state.deal && state.dealCount && state.dealCount > 1) {
    prizesFinal = applyDeal(prizesBase, state.dealCount);
  } else {
    prizesFinal = prizesBase.slice();
  }

  const playersMap = getPlayersMap();
  const lines = [];

  for (let i = 0; i < winners.length && i < prizesFinal.length; i++) {
    const place = winners[i].place;
    const nick = winners[i].nickname;
    const full = playersMap[nick] || nick;
    const amount = prizesFinal[place - 1];
    lines.push(`מקום ${place} - ${amount} ש"ח - ${full}`);
  }

  const summary = lines.join("\n");
  if (!summary) {
    await sendMessage(chatId, "לא נבחרו זוכים, אין מה לסכם.");
    resetState(chatId);
    return;
  }

  const waText = "סיכום טורניר פוקר:\n" + summary;
  const waUrl =
    "https://api.whatsapp.com/send?text=" + encodeURIComponent(waText);

  const msg =
    "סיכום זכיות הטורניר:\n\n" +
    summary +
    `\n\n<a href="${waUrl}">שיתוף ב WhatsApp</a>`;

  await sendMessage(chatId, msg);

  const kb = {
    inline_keyboard: [
      [{ text: "התחל חישוב זכיות חדש", callback_data: "START_FLOW" }]
    ]
  };
  await sendMessage(chatId, "רוצה להתחיל טורניר חדש?", {
    reply_markup: JSON.stringify(kb)
  });

  resetState(chatId);
}

/**
 * מסלול Webhook - טלגרם תשלח לפה כל עדכון
 */
app.post(`/webhook/${BOT_TOKEN}`, async (req, res) => {
  const update = req.body;
  console.log("Incoming update:", JSON.stringify(update));
  try {
    await handleUpdate(update);
  } catch (err) {
    console.error("handleUpdate error:", err);
  }
  // חייבים להחזיר 200 מהר כדי שטלגרם תהיה מרוצה
  res.sendStatus(200);
});

// ל healthcheck
app.get("/", (req, res) => {
  res.send("Poker Telegram Bot is running");
});

// האזנה לפורט (לפלטפורמות כמו Render / Railway)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server started on port", PORT);
});
