/***************************************************
 * Telegram Poker Tournament Bot
 * Node.js + Webhook (Render) + Google Sheets players
 ***************************************************/

const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");

/***************************************************
 * CONFIG
 ***************************************************/

// טוקן של הבוט שלך
const BOT_TOKEN = "8142647492:AAFLz8UkeXHqS2LCH2EmW3Quktu8nCyzGUQ"; // ← לוודא שזה הטוקן הנכון
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// כתובת Google Sheets שפורסמה כ CSV
// להגדיר ב Render תחת Environment: PLAYERS_URL
const PLAYERS_URL = process.env.PLAYERS_URL || "";

const app = express();
app.use(bodyParser.json());

// state לפי chatId
const chatStates = new Map();

/***************************************************
 * GLOBAL PLAYERS - WITHOUT CACHE
 ***************************************************/

// מפת שחקנים ברירת מחדל אם אין Google Sheets או שיש בעיה בטעינה
function getFallbackPlayersMap() {
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

// טוען מהמיקום של ה Google Sheet (CSV)
async function fetchPlayersFromSheet() {
  if (!PLAYERS_URL) return null;

  try {
    const res = await fetch(PLAYERS_URL);
    const text = await res.text();

    const lines = text.split(/\r?\n/).filter(l => l.trim());
    const map = {};

    // מניחים ששורה ראשונה היא כותרת: nickname,fullname
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.split(",");
      if (parts.length < 2) continue;
      const nick = parts[0].trim();
      const full = parts[1].trim();
      if (!nick) continue;
      map[nick] = full || nick;
    }

    return map;
  } catch (err) {
    console.error("Error loading players from sheet:", err);
    return null;
  }
}

// מחזיר מפת שחקנים – קודם שיטס, אם ריק נופל לפולבאק
async function getPlayersMap() {
  let map = await fetchPlayersFromSheet();

  if (!map || !Object.keys(map).length) {
    console.error("Players from sheet are empty or failed, using fallback list");
    map = getFallbackPlayersMap();
  }

  return map;
}

async function getAllNicknames() {
  const map = await getPlayersMap();
  return Object.keys(map).sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );
}

/***************************************************
 * STATE MANAGEMENT
 ***************************************************/

function loadState(chatId) {
  if (!chatStates.has(chatId)) {
    chatStates.set(chatId, {
      chatId,
      step: "START",
      mode: null,              // REGULAR / BOUNTY
      gameType: null,          // טקסס / אומהה 4 / אומהה 5 / אומהה 6
      numPlayers: null,
      buyIn: null,
      deal: false,
      dealCount: 0,
      prizesBase: [],
      currentPlace: 1,
      winners: [],             // {place, nickname, bounty}
      extraBounties: [],       // [{nickname, bounty}]
      remainingPlayers: [],
      pendingWinnerIndex: null, // למי שואלים באונטי כרגע
      lastExtraBountyNick: null
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

/***************************************************
 * TELEGRAM API
 ***************************************************/

async function callTelegramApi(method, payload) {
  const url = `${TELEGRAM_API}/${method}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!data.ok) {
    console.error("Telegram API error", method, JSON.stringify(data));
  }
  return data;
}

function sendMessage(chatId, text, extra) {
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: "HTML"
  };
  if (extra) Object.assign(payload, extra);
  return callTelegramApi("sendMessage", payload);
}

function answerCallbackQuery(id, text) {
  const payload = { callback_query_id: id };
  if (text) {
    payload.text = text;
    payload.show_alert = false;
  }
  return callTelegramApi("answerCallbackQuery", payload);
}

/***************************************************
 * PRIZE TABLE
 ***************************************************/
function getPrizePercents(numPlayers) {
  if (numPlayers >= 2 && numPlayers <= 5) return [100];
  if (numPlayers >= 6 && numPlayers <= 9) return [65, 35];
  if (numPlayers >= 10 && numPlayers <= 15) return [50, 30, 20];
  if (numPlayers >= 16 && numPlayers <= 22) return [45, 27, 18, 10];
  if (numPlayers >= 23 && numPlayers <= 29) return [42, 25, 16, 10, 7];
  if (numPlayers >= 30 && numPlayers <= 35) return [38, 23, 16, 10, 7, 6];
  if (numPlayers >= 36 && numPlayers <= 40) return [35, 22, 15, 10, 7, 6, 5];
  if (numPlayers >= 41 && numPlayers <= 47) return [32, 21, 15, 10, 7, 6, 5, 4];
  if (numPlayers >= 48 && numPlayers <= 56) return [30, 20, 14, 9, 7, 6, 5, 5, 4];
  if (numPlayers >= 57) return [28, 19, 14, 9, 7, 6, 5, 5, 4, 3];
  return [100];
}

function initPrizes(state) {
  const percents = getPrizePercents(state.numPlayers);
  const totalPot = state.numPlayers * state.buyIn;

  const prizes = [];
  let sum = 0;

  for (let p of percents) {
    const amount = Math.round((totalPot * p) / 100);
    prizes.push(amount);
    sum += amount;
  }

  const diff = Math.round(totalPot - sum);
  if (diff !== 0 && prizes.length > 0) {
    prizes[0] += diff;
  }

  state.prizesBase = prizes;
}

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

/***************************************************
 * MAIN UPDATE HANDLER
 ***************************************************/
async function handleUpdate(update) {
  console.log("Update:", JSON.stringify(update));
  if (update.message) {
    await handleMessage(update.message);
  } else if (update.callback_query) {
    await handleCallback(update.callback_query);
  }
}

/***************************************************
 * TEXT MESSAGES
 ***************************************************/
async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();
  let state = loadState(chatId);

  if (text === "/start") {
    resetState(chatId);
    state = loadState(chatId);

    await sendMessage(
      chatId,
      "ברוך הבא לבוט חישוב זכיות בטורניר פוקר.\n\n" +
      "נתחיל בבחירת סוג משחק:"
    );
    await askGameType(state);
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
    case "SELECT_WINNERS_SEARCH":
      await handleWinnerSearchInput(state, text);
      break;
    case "ASK_BOUNTY_FOR_WINNER":
      await handleBountyForWinnerInput(state, text);
      break;
    case "SELECT_EXTRA_BOUNTY_SEARCH":
      await handleExtraBountySearchInput(state, text);
      break;
    case "ASK_EXTRA_BOUNTY_AMOUNT":
      await handleExtraBountyAmountInput(state, text);
      break;
    default:
      await sendMessage(chatId, "כדי להתחיל חישוב חדש, כתוב /start");
      break;
  }
}

/***************************************************
 * CALLBACK QUERIES (BUTTONS)
 ***************************************************/
async function handleCallback(cb) {
  const data = cb.data;
  const msg = cb.message;
  const chatId = msg.chat.id;
  let state = loadState(chatId);

  // התחלה חדשה מהסיכום
  if (data === "START_FLOW") {
    resetState(chatId);
    state = loadState(chatId);
    await answerCallbackQuery(cb.id);
    await sendMessage(chatId, "התחל חישוב זכיות חדש.\n\nנתחיל בבחירת סוג משחק:");
    await askGameType(state);
    return;
  }

  // בחירת סוג משחק
  if (data === "GAME_TEXAS" || data === "GAME_O4" || data === "GAME_O5" || data === "GAME_O6") {
    let label = "טקסס";
    if (data === "GAME_O4") label = "אומהה 4";
    if (data === "GAME_O5") label = "אומהה 5";
    if (data === "GAME_O6") label = "אומהה 6";

    state.gameType = label;
    saveState(state);
    await answerCallbackQuery(cb.id);
    await askTournamentMode(state);
    return;
  }

  // סוג טורניר: רגיל או באונטי
  if (data === "MODE_REGULAR" || data === "MODE_BOUNTY") {
    state.mode = data === "MODE_REGULAR" ? "REGULAR" : "BOUNTY";
    state.step = "ASK_PLAYERS";
    saveState(state);
    await answerCallbackQuery(cb.id);
    await sendMessage(chatId, "כמה שחקנים היו בטורניר?");
    return;
  }

  // האם היה דיל
  if (data === "DEAL_YES") {
    state.deal = true;
    state.step = "ASK_DEAL_COUNT";
    saveState(state);
    await answerCallbackQuery(cb.id);
    await sendMessage(chatId, "כמה שחקנים היו בדיל?");
    return;
  }

  if (data === "DEAL_NO") {
    state.deal = false;
    state.dealCount = 0;
    initPrizes(state);
    state.step = "SELECT_WINNERS_SEARCH";
    state.currentPlace = 1;
    state.winners = [];
    state.remainingPlayers = await getAllNicknames();
    saveState(state);
    await answerCallbackQuery(cb.id);
    await askForNextWinner(state);
    return;
  }

  // בחירת זוכה מהמקלדת
  if (data && data.indexOf("WINNER|") === 0) {
    const nick = data.split("|")[1];
    await handleWinnerSelection(state, nick, cb);
    return;
  }

  // האם היו שחקנים נוספים שלקחו באונטי
  if (data === "MORE_BOUNTY_NO") {
    await answerCallbackQuery(cb.id);
    await finalizeResults(state);
    return;
  }

  if (data === "MORE_BOUNTY_YES") {
    await answerCallbackQuery(cb.id);
    state.step = "SELECT_EXTRA_BOUNTY_SEARCH";
    saveState(state);
    await sendMessage(
      chatId,
      "מעולה, נאתר שחקנים נוספים שלקחו באונטי.\n" +
      "תכתוב 2-3 אותיות מהניק או מהשם של השחקן:"
    );
    return;
  }

  // בחירת שחקן באונטי נוסף
  if (data && data.indexOf("EXTRA_BOUNTY|") === 0) {
    const nick = data.split("|")[1];

    state.extraBounties = state.extraBounties || [];
    state.extraBounties.push({ nickname: nick, bounty: 0 });
    state.lastExtraBountyNick = nick;
    state.step = "ASK_EXTRA_BOUNTY_AMOUNT";
    saveState(state);

    await answerCallbackQuery(cb.id);
    await sendMessage(
      chatId,
      `כמה באונטי ${nick} לקח? (אם לא לקח - כתוב 0)`
    );
    return;
  }

  await answerCallbackQuery(cb.id);
}

/***************************************************
 * FLOW HELPERS
 ***************************************************/

// שאלה: סוג משחק
async function askGameType(state) {
  const chatId = state.chatId;
  state.step = "ASK_GAME_TYPE";
  saveState(state);

  const kb = {
    inline_keyboard: [
      [
        { text: "טקסס", callback_data: "GAME_TEXAS" },
        { text: "אומהה 4", callback_data: "GAME_O4" }
      ],
      [
        { text: "אומהה 5", callback_data: "GAME_O5" },
        { text: "אומהה 6", callback_data: "GAME_O6" }
      ]
    ]
  };

  await sendMessage(chatId, "בחר סוג משחק:", {
    reply_markup: JSON.stringify(kb)
  });
}

// שאלה: רגיל או באונטי
async function askTournamentMode(state) {
  const chatId = state.chatId;
  state.step = "ASK_MODE";
  saveState(state);

  const kb = {
    inline_keyboard: [
      [
        { text: "רגיל", callback_data: "MODE_REGULAR" },
        { text: "באונטי", callback_data: "MODE_BOUNTY" }
      ]
    ]
  };

  await sendMessage(chatId, "בחר סוג טורניר:", {
    reply_markup: JSON.stringify(kb)
  });
}

// כמה שחקנים
async function handlePlayersCountInput(state, text) {
  const chatId = state.chatId;
  const n = parseInt(text, 10);
  if (isNaN(n) || n < 2) {
    await sendMessage(chatId, "מספר שחקנים לא תקין. הזן מספר גדול או שווה ל 2.");
    return;
  }
  state.numPlayers = n;
  state.step = "ASK_BUYIN";
  saveState(state);
  await sendMessage(chatId, "מה היה סכום הכניסה בש\"ח?");
}

// buy-in
async function handleBuyInInput(state, text) {
  const chatId = state.chatId;
  const amount = parseFloat(String(text).replace(",", "."));
  if (isNaN(amount) || amount <= 0) {
    await sendMessage(chatId, "סכום כניסה לא תקין. הזן מספר חיובי.");
    return;
  }
  state.buyIn = amount;
  state.step = "ASK_DEAL";
  saveState(state);

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

// מספר שחקנים בדיל
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

  state.step = "SELECT_WINNERS_SEARCH";
  state.currentPlace = 1;
  state.winners = [];
  state.remainingPlayers = await getAllNicknames();
  saveState(state);

  await sendMessage(chatId, "יש " + d + " שחקנים בדיל. בוא נבחר את המיקומים.");
  await askForNextWinner(state);
}

/***************************************************
 * בחירת זוכים – חיפוש
 ***************************************************/
async function askForNextWinner(state) {
  const chatId = state.chatId;
  const place = state.currentPlace;
  const maxPlaces = state.prizesBase.length;

  if (place > maxPlaces) {
    await finishWinnersPhase(state);
    return;
  }

  if (!state.remainingPlayers || state.remainingPlayers.length === 0) {
    state.remainingPlayers = await getAllNicknames();
  }

  const txt =
    "מקום " + place + ":\n" +
    "תכתוב 2-3 אותיות מהניק או מהשם, ואני אמצא לך 🔍";

  state.step = "SELECT_WINNERS_SEARCH";
  saveState(state);
  await sendMessage(chatId, txt);
}

async function handleWinnerSearchInput(state, text) {
  const chatId = state.chatId;
  const query = (text || "").trim();

  if (!query || query.length < 2) {
    await sendMessage(
      chatId,
      "תכתוב לפחות 2 אותיות מהניק או מהשם כדי שאוכל לחפש 🔍"
    );
    return;
  }

  const playersMap = await getPlayersMap();
  const players = state.remainingPlayers && state.remainingPlayers.length
    ? state.remainingPlayers
    : await getAllNicknames();
  const q = query.toLowerCase();

  const matches = players.filter(nick => {
    const full = playersMap[nick] || "";
    return (
      nick.toLowerCase().includes(q) ||
      full.toLowerCase().includes(q)
    );
  });

  const place = state.currentPlace;

  if (matches.length === 0) {
    await sendMessage(
      chatId,
      "לא מצאתי שחקן שמתאים לטקסט הזה 😅\n" +
      "נסה לכתוב חלק אחר מהניק או מהשם."
    );
    return;
  }

  if (matches.length === 1) {
    const chosen = matches[0];
    await registerWinnerAndContinue(state, chosen);
    return;
  }

  if (matches.length > 10) {
    await sendMessage(
      chatId,
      "יש יותר מדי תוצאות 🤯\n" +
      "תנסה להוסיף עוד אות או שתיים כדי לצמצם."
    );
    return;
  }

  const keyboard = [];
  let row = [];
  matches.forEach(nick => {
    row.push({ text: nick, callback_data: "WINNER|" + nick });
    if (row.length === 2) {
      keyboard.push(row);
      row = [];
    }
  });
  if (row.length) keyboard.push(row);

  await sendMessage(
    chatId,
    "מצאתי כמה אפשרויות למקום " + place + ":\nבחר מהכפתורים 👇",
    { reply_markup: JSON.stringify({ inline_keyboard: keyboard }) }
  );
}

async function handleWinnerSelection(state, nickname, cb) {
  const chatId = state.chatId;
  const players = state.remainingPlayers && state.remainingPlayers.length
    ? state.remainingPlayers
    : await getAllNicknames();

  const exists = players.includes(nickname);
  if (!exists) {
    await answerCallbackQuery(cb.id, "שחקן לא קיים ברשימה.");
    return;
  }

  await answerCallbackQuery(cb.id);
  await registerWinnerAndContinue(state, nickname);
}

async function registerWinnerAndContinue(state, nickname) {
  const chatId = state.chatId;
  const place = state.currentPlace;
  const players = state.remainingPlayers && state.remainingPlayers.length
    ? state.remainingPlayers
    : await getAllNicknames();

  state.winners = state.winners || [];

  if (state.winners.some(w => w.nickname === nickname)) {
    await sendMessage(chatId, "שחקן זה כבר נבחר לזכייה.");
    return;
  }

  state.winners.push({ place, nickname, bounty: 0 });
  state.remainingPlayers = players.filter(p => p !== nickname);
  state.currentPlace = place + 1;

  saveState(state);

  await sendMessage(chatId, "נבחר: " + nickname + " למקום " + place + " ✅");

  if (state.mode === "BOUNTY") {
    state.pendingWinnerIndex = state.winners.length - 1;
    state.step = "ASK_BOUNTY_FOR_WINNER";
    saveState(state);
    await sendMessage(
      chatId,
      "כמה באונטי השחקן לקח? (אם לא לקח - כתוב 0)"
    );
    return;
  }

  await askForNextWinner(state);
}

/***************************************************
 * באונטי – עבור זוכים
 ***************************************************/
async function handleBountyForWinnerInput(state, text) {
  const chatId = state.chatId;
  const idx = state.pendingWinnerIndex;
  if (idx == null || !state.winners[idx]) {
    await askForNextWinner(state);
    return;
  }

  const amount = parseFloat(String(text).replace(",", "."));
  if (isNaN(amount) || amount < 0) {
    await sendMessage(chatId, "סכום באונטי לא תקין. הזן מספר 0 או יותר.");
    return;
  }

  state.winners[idx].bounty = amount;
  state.pendingWinnerIndex = null;
  state.step = "SELECT_WINNERS_SEARCH";
  saveState(state);

  await askForNextWinner(state);
}

/***************************************************
 * אחרי שסיימנו לבחור זוכים
 ***************************************************/
async function finishWinnersPhase(state) {
  const chatId = state.chatId;

  if (state.mode === "BOUNTY") {
    state.step = "ASK_EXTRA_BOUNTY_YN";
    saveState(state);

    const kb = {
      inline_keyboard: [
        [
          { text: "לא", callback_data: "MORE_BOUNTY_NO" },
          { text: "כן", callback_data: "MORE_BOUNTY_YES" }
        ]
      ]
    };

    await sendMessage(
      chatId,
      "האם היו שחקנים נוספים שלקחו באונטי (לא נכנסו לטבלת הזכיות)?",
      { reply_markup: JSON.stringify(kb) }
    );
    return;
  }

  await finalizeResults(state);
}

/***************************************************
 * חיפוש שחקני באונטי נוספים
 ***************************************************/
async function handleExtraBountySearchInput(state, text) {
  const chatId = state.chatId;
  const query = (text || "").trim();

  if (!query || query.length < 2) {
    await sendMessage(
      chatId,
      "תכתוב לפחות 2 אותיות מהניק או מהשם כדי שאוכל לחפש 🔍"
    );
    return;
  }

  const playersMap = await getPlayersMap();
  const allPlayers = await getAllNicknames();

  const usedNicks = new Set();
  (state.winners || []).forEach(w => usedNicks.add(w.nickname));
  (state.extraBounties || []).forEach(b => usedNicks.add(b.nickname));

  const candidates = allPlayers.filter(nick => !usedNicks.has(nick));

  const q = query.toLowerCase();
  const matches = candidates.filter(nick => {
    const full = playersMap[nick] || "";
    return (
      nick.toLowerCase().includes(q) ||
      full.toLowerCase().includes(q)
    );
  });

  if (matches.length === 0) {
    await sendMessage(
      chatId,
      "לא מצאתי שחקן שמתאים לטקסט הזה 😅\n" +
      "נסה לכתוב חלק אחר מהניק או מהשם."
    );
    return;
  }

  if (matches.length === 1) {
    const chosen = matches[0];
    state.extraBounties = state.extraBounties || [];
    state.extraBounties.push({ nickname: chosen, bounty: 0 });
    state.lastExtraBountyNick = chosen;
    state.step = "ASK_EXTRA_BOUNTY_AMOUNT";
    saveState(state);

    await sendMessage(
      chatId,
      "כמה באונטי " + chosen + " לקח? (אם לא לקח - כתוב 0)"
    );
    return;
  }

  if (matches.length > 10) {
    await sendMessage(
      chatId,
      "יש יותר מדי תוצאות 🤯\n" +
      "תנסה להוסיף עוד אות או שתיים כדי לצמצם."
    );
    return;
  }

  const keyboard = [];
  let row = [];
  matches.forEach(nick => {
    row.push({ text: nick, callback_data: "EXTRA_BOUNTY|" + nick });
    if (row.length === 2) {
      keyboard.push(row);
      row = [];
    }
  });
  if (row.length) keyboard.push(row);

  await sendMessage(
    chatId,
    "מצאתי כמה אפשרויות:\nבחר מהכפתורים 👇",
    { reply_markup: JSON.stringify({ inline_keyboard: keyboard }) }
  );
}

async function handleExtraBountyAmountInput(state, text) {
  const chatId = state.chatId;
  const nick = state.lastExtraBountyNick;
  if (!nick || !state.extraBounties) {
    state.step = "SELECT_EXTRA_BOUNTY_SEARCH";
    saveState(state);
    await sendMessage(
      chatId,
      "ננסה שוב – תכתוב 2-3 אותיות מהניק או מהשם של השחקן:"
    );
    return;
  }

  const amount = parseFloat(String(text).replace(",", "."));
  if (isNaN(amount) || amount < 0) {
    await sendMessage(chatId, "סכום באונטי לא תקין. הזן מספר 0 או יותר.");
    return;
  }

  const entry = state.extraBounties.find(b => b.nickname === nick);
  if (entry) {
    entry.bounty = amount;
  }

  state.lastExtraBountyNick = null;
  state.step = "ASK_EXTRA_BOUNTY_YN";
  saveState(state);

  const kb = {
    inline_keyboard: [
      [
        { text: "לא", callback_data: "MORE_BOUNTY_NO" },
        { text: "כן", callback_data: "MORE_BOUNTY_YES" }
      ]
    ]
  };

  await sendMessage(
    chatId,
    "האם היה שחקן נוסף שלקח באונטי?",
    { reply_markup: JSON.stringify(kb) }
  );
}

/***************************************************
 * סיכום תוצאות
 ***************************************************/
async function finalizeResults(state) {
  const chatId = state.chatId;
  const winners = state.winners || [];
  const basePrizes = state.prizesBase || [];

  if (!winners.length || !basePrizes.length) {
    await sendMessage(chatId, "לא נבחרו זוכים, אין מה לסכם.");
    resetState(chatId);
    return;
  }

  let finalPrizes;
  if (state.deal && state.dealCount && state.dealCount > 1) {
    finalPrizes = applyDeal(basePrizes, state.dealCount);
  } else {
    finalPrizes = basePrizes.slice();
  }

  const playersMap = await getPlayersMap();
  const lines = [];

  const gameLine = state.gameType
    ? "🎲 סוג משחק: " + state.gameType + "\n"
    : "";

  let dealText = "לא";
  if (state.deal && state.dealCount && state.dealCount > 0) {
    if (state.dealCount >= winners.length) {
      dealText = "כן - מלא (כל הזוכים)";
    } else {
      dealText = "כן - חלקי (" + state.dealCount + " מתוך " + winners.length + " הזוכים)";
    }
  }

  const header =
    "🔥 סיכום הטילט היומי:\n\n" +
    gameLine +
    "👥 מספר שחקנים: " + state.numPlayers + "\n" +
    "💵 סכום כניסה: " + state.buyIn + "₪\n" +
    "🤝 דיל: " + dealText + "\n\n" +
    "🏆 טבלת זכיות:\n";

  winners.sort((a, b) => a.place - b.place);

  winners.forEach(w => {
    const place = w.place;
    const nick = w.nickname;
    const full = playersMap[nick] || nick;
    const amount = finalPrizes[place - 1] || 0;
    const bounty = w.bounty || 0;

    let emoji = "▫️";
    if (place === 1) emoji = "👑";
    else if (place === 2) emoji = "🥈";
    else if (place === 3) emoji = "🥉";
    else if (place === 4) emoji = "💪";

    const inDeal =
      state.deal && state.dealCount && place <= state.dealCount ? " (בדיל)" : "";

    const bountyText =
      state.mode === "BOUNTY"
        ? " (+" + bounty + "₪ באונטי)"
        : "";

    lines.push(
      emoji +
      " מקום " + place +
      " - " + full +
      " (" + nick + ")" +
      " - " + amount + "₪" +
      inDeal +
      bountyText
    );
  });

  if (state.mode === "BOUNTY" && state.extraBounties && state.extraBounties.length) {
    lines.push("\n💣 שחקנים נוספים שלקחו באונטי:");
    state.extraBounties.forEach(b => {
      const nick = b.nickname;
      const full = playersMap[nick] || nick;
      const bounty = b.bounty || 0;
      lines.push("• " + full + " (" + nick + ") - " + bounty + "₪ באונטי");
    });
  }

  const body = lines.join("\n");

  const footer =
    "\n\n🙏 תייגו את בעל הפייבוקס @ תודה";

  const summaryText = header + body + footer;

  const waUrl =
    "https://api.whatsapp.com/send?text=" +
    encodeURIComponent(summaryText);

  const msg =
    summaryText + "\n\n" +
    '<a href="' + waUrl + '">🔗 שיתוף בוואטסאפ</a>';

  await sendMessage(chatId, msg);

  const kb = {
    inline_keyboard: [
      [{ text: "🔁 התחל חישוב זכיות חדש", callback_data: "START_FLOW" }]
    ]
  };

  await sendMessage(chatId, "רוצה להתחיל טורניר חדש?", {
    reply_markup: JSON.stringify(kb)
  });

  resetState(chatId);
}

/***************************************************
 * WEBHOOK + SERVER
 ***************************************************/
app.post("/webhook/telegram", async (req, res) => {
  try {
    const update = req.body;
    await handleUpdate(update);
  } catch (err) {
    console.error("Error handling update:", err);
  }
  res.sendStatus(200);
});

app.get("/", (req, res) => {
  res.send("Poker Telegram Bot is running");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server started on port", PORT);
});
