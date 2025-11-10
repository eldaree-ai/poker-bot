/***************************************************
 * Telegram Poker Tournament Bot - Node + Webhook + Search + Bounty + Google Sheets
 ***************************************************/

const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");

const BOT_TOKEN = "8142647492:AAFLz8UkeXHqS2LCH2EmW3Quktu8nCyzGUQ"; // תחליף לטוקן האמיתי שלך
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// כתובת ה Web App של Apps Script שמחזיר JSON של שחקנים
const PLAYERS_URL = process.env.PLAYERS_URL || null;

const app = express();
app.use(bodyParser.json());

// state לפי chatId
const chatStates = new Map();

// קאש של רשימת השחקנים מהשיטס
let cachedPlayersMap = null;
const PLAYERS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 דקות

/***************************************************
 * טעינת שחקנים מ Google Sheets דרך Apps Script
 ***************************************************/
async function refreshPlayersMapFromRemote() {
  if (!PLAYERS_URL) {
    console.log("PLAYERS_URL not set, using static players map from code");
    return;
  }

  try {
    const res = await fetch(PLAYERS_URL);
    if (!res.ok) {
      console.error("Failed fetching players from Sheets, status:", res.status);
      return;
    }

    const json = await res.json();
    if (json && typeof json === "object" && !Array.isArray(json) && !json.error) {
      cachedPlayersMap = json;
      console.log(
        "Players map refreshed from Sheets. Count:",
        Object.keys(json).length
      );
    } else {
      console.error("Invalid players JSON from Sheets:", json);
    }
  } catch (err) {
    console.error("Error fetching players from Sheets:", err);
  }
}

// טעינה ראשונית
refreshPlayersMapFromRemote();

// רענון כל 5 דקות
setInterval(() => {
  refreshPlayersMapFromRemote();
}, PLAYERS_CACHE_TTL_MS);

/***************************************************
 * שחקנים - getPlayersMap עם fallback לקוד
 ***************************************************/
function getPlayersMap() {
  // אם יש נתונים מהשיטס - נשתמש בהם
  if (cachedPlayersMap && Object.keys(cachedPlayersMap).length > 0) {
    return cachedPlayersMap;
  }

  // פולבאק קשיח בקוד
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
  const map = getPlayersMap();
  return Object.keys(map).sort(function (a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  });
}

/***************************************************
 * ניהול state
 ***************************************************/
function loadState(chatId) {
  if (!chatStates.has(chatId)) {
    chatStates.set(chatId, {
      chatId: chatId,
      step: "START",
      gameType: null,            // טקסס / אומהה 4 / אומהה 5 / אומהה 6
      tournamentType: null,      // "REGULAR" או "BOUNTY"
      numPlayers: null,
      buyIn: null,
      deal: false,
      dealCount: 0,
      prizesBase: [],
      currentPlace: 1,
      winners: [],               // [{place, nickname, bounty}]
      remainingPlayers: getAllNicknames(),
      pendingWinner: null,       // לבאונטי - מנצח שממתין להזנת באונטי
      extraBounties: [],         // [{nickname, bounty}] מחוץ לפרסים
      pendingExtraBountyNick: null
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
 * Telegram API
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
    text: text,
    parse_mode: "HTML"
  };
  if (extra) {
    Object.assign(payload, extra);
  }
  return callTelegramApi("sendMessage", payload);
}

function editMessageReplyMarkup(chatId, messageId, replyMarkup) {
  return callTelegramApi("editMessageReplyMarkup", {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: JSON.stringify(replyMarkup)
  });
}

function answerCallbackQuery(callbackQueryId, text) {
  const payload = { callback_query_id: callbackQueryId };
  if (text) {
    payload.text = text;
    payload.show_alert = false;
  }
  return callTelegramApi("answerCallbackQuery", payload);
}

/***************************************************
 * טבלת אחוזים שהגדרת
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
    remainder--;
    result[k]++;
    k++;
  }

  return result;
}

/***************************************************
 * ניהול update כללי
 ***************************************************/
function handleUpdate(update) {
  console.log("Update:", JSON.stringify(update));
  if (update.message) {
    handleMessage(update.message);
  } else if (update.callback_query) {
    handleCallback(update.callback_query);
  }
}

/***************************************************
 * הודעות טקסט
 ***************************************************/
function handleMessage(msg) {
  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();
  let state = loadState(chatId);

  if (text === "/start") {
    resetState(chatId);
    state = loadState(chatId);
    state.step = "ASK_GAME_TYPE";
    saveState(state);

    const kbGame = {
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

    sendMessage(
      chatId,
      " ברוך הבא לבוט חישוב זכיות בטורניר פוקר (נבנה ע"י 2GRAND).\n\nבחר סוג משחק:",
      { reply_markup: JSON.stringify(kbGame) }
    );
    return;
  }
  
  switch (state.step) {
    case "ASK_GAME_TYPE":
      sendMessage(chatId, "בחר סוג משחק מהכפתורים.");
      break;
    case "ASK_TOURNAMENT_TYPE":
      sendMessage(chatId, "בחר סוג טורניר מהכפתורים.");
      break;
    case "ASK_PLAYERS":
      handlePlayersCountInput(state, text);
      break;
    case "ASK_BUYIN":
      handleBuyInInput(state, text);
      break;
    case "ASK_DEAL_COUNT":
      handleDealCountInput(state, text);
      break;
    case "SELECT_WINNERS":
      handleWinnerSearchInput(state, text);
      break;
    case "ASK_WINNER_BOUNTY":
      handleWinnerBountyInput(state, text);
      break;
    case "ASK_EXTRA_BOUNTY_SEARCH":
      handleExtraBountySearchInput(state, text);
      break;
    case "ASK_EXTRA_BOUNTY_AMOUNT":
      handleExtraBountyAmountInput(state, text);
      break;
    default:
      sendMessage(chatId, "כדי להתחיל חישוב חדש, כתוב /start");
      break;
  }
}

/***************************************************
 * callback buttons
 ***************************************************/
function handleCallback(cb) {
  const data = cb.data;
  const msg = cb.message;
  const chatId = msg.chat.id;
  let state = loadState(chatId);

  // בחירת סוג משחק
  if (
    data === "GAME_TEXAS" ||
    data === "GAME_O4" ||
    data === "GAME_O5" ||
    data === "GAME_O6"
  ) {
    if (data === "GAME_TEXAS") state.gameType = "טקסס";
    if (data === "GAME_O4") state.gameType = "אומהה 4";
    if (data === "GAME_O5") state.gameType = "אומהה 5";
    if (data === "GAME_O6") state.gameType = "אומהה 6";

    state.step = "ASK_TOURNAMENT_TYPE";
    saveState(state);

    const kbType = {
      inline_keyboard: [
        [
          { text: "🃏 רגיל", callback_data: "TOURNAMENT_REGULAR" },
          { text: "💣 באונטי", callback_data: "TOURNAMENT_BOUNTY" }
        ]
      ]
    };

    answerCallbackQuery(cb.id);
    sendMessage(
      chatId,
      "בחר סוג טורניר:",
      { reply_markup: JSON.stringify(kbType) }
    );
    return;
  }

  // בחירת סוג טורניר
  if (data === "TOURNAMENT_REGULAR" || data === "TOURNAMENT_BOUNTY") {
    state.tournamentType = data === "TOURNAMENT_REGULAR" ? "REGULAR" : "BOUNTY";
    state.step = "ASK_PLAYERS";
    saveState(state);
    answerCallbackQuery(cb.id);
    sendMessage(chatId, "כמה שחקנים היו בטורניר?");
    return;
  }

  if (data === "START_FLOW") {
    resetState(chatId);
    state = loadState(chatId);
    state.step = "ASK_GAME_TYPE";
    saveState(state);

    const kbGame = {
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

    answerCallbackQuery(cb.id);
    sendMessage(
      chatId,
      "התחל חישוב זכיות חדש.\n\nבחר סוג משחק:",
      { reply_markup: JSON.stringify(kbGame) }
    );
    return;
  }

  if (data === "DEAL_YES") {
    state.deal = true;
    state.step = "ASK_DEAL_COUNT";
    saveState(state);
    answerCallbackQuery(cb.id);
    sendMessage(state.chatId, "כמה שחקנים עשו דיל?");
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
    saveState(state);
    answerCallbackQuery(cb.id);
    askForNextWinner(state);
    return;
  }

  if (data && data.indexOf("WINNER|") === 0) {
    const nick = data.split("|")[1];
    selectWinner(state, nick, cb.id);
    return;
  }

  // שאלה על באונטי נוסף
  if (data === "EXTRA_BOUNTY_YES") {
    state.step = "ASK_EXTRA_BOUNTY_SEARCH";
    saveState(state);
    answerCallbackQuery(cb.id);
    sendMessage(
      chatId,
      "תכתוב 2-3 אותיות מהניק או מהשם של השחקן שלקח באונטי, ואני אמצא לך 🔍"
    );
    return;
  }

  if (data === "EXTRA_BOUNTY_NO") {
    answerCallbackQuery(cb.id);
    finalizeResults(state);
    return;
  }

  // בחירת שחקן לבאונטי נוסף דרך כפתור
  if (data && data.indexOf("EXTRA_BOUNTY_PICK|") === 0) {
    const nick = data.split("|")[1];
    state.pendingExtraBountyNick = nick;
    state.step = "ASK_EXTRA_BOUNTY_AMOUNT";
    saveState(state);
    answerCallbackQuery(cb.id);
    sendMessage(
      chatId,
      "כמה באונטי השחקן לקח? אם לא לקח, כתוב 0."
    );
    return;
  }

  answerCallbackQuery(cb.id);
}

/***************************************************
 * שלבי השיחה
 ***************************************************/
function handlePlayersCountInput(state, text) {
  const chatId = state.chatId;
  const n = parseInt(text, 10);
  if (isNaN(n) || n < 2) {
    sendMessage(chatId, "מספר שחקנים לא תקין. הזן מספר גדול או שווה ל 2.");
    return;
  }
  state.numPlayers = n;
  state.step = "ASK_BUYIN";
  saveState(state);
  sendMessage(chatId, "מה היה סכום הכניסה בש\"ח?");
}

function handleBuyInInput(state, text) {
  const chatId = state.chatId;
  const amount = parseFloat(String(text).replace(",", "."));
  if (isNaN(amount) || amount <= 0) {
    sendMessage(chatId, "סכום כניסה לא תקין. הזן מספר חיובי.");
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

  sendMessage(chatId, "האם היה דיל?", {
    reply_markup: JSON.stringify(kb)
  });
}

function handleDealCountInput(state, text) {
  const chatId = state.chatId;
  const d = parseInt(text, 10);
  const maxPlaces = getPrizePercents(state.numPlayers).length;

  if (isNaN(d) || d < 2 || d > maxPlaces) {
    sendMessage(
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
  saveState(state);

  sendMessage(chatId, "יש " + d + " שחקנים בדיל. בוא נבחר את המיקומים.");
  askForNextWinner(state);
}

/***************************************************
 * בחירת זוכים - חיפוש
 ***************************************************/
function askForNextWinner(state) {
  const chatId = state.chatId;
  const place = state.currentPlace;
  const maxPlaces = state.prizesBase.length;

  if (place > maxPlaces) {
    if (state.tournamentType === "BOUNTY") {
      askExtraBountyQuestion(state);
    } else {
      finalizeResults(state);
    }
    return;
  }

  const players = state.remainingPlayers || getAllNicknames();
  if (!players || players.length === 0) {
    if (state.tournamentType === "BOUNTY") {
      askExtraBountyQuestion(state);
    } else {
      finalizeResults(state);
    }
    return;
  }

  const txt =
    "מקום " + place + ":\n" +
    "תכתוב 2-3 אותיות מהניק או מהשם, ואני אמצא לך 🔍";

  sendMessage(chatId, txt);
}

function handleWinnerSearchInput(state, text) {
  const chatId = state.chatId;
  const query = (text || "").trim();
  const players = state.remainingPlayers || getAllNicknames();
  const place = state.currentPlace;

  if (!query || query.length < 2) {
    sendMessage(
      chatId,
      "תכתוב לפחות 2 אותיות מהניק או מהשם כדי שאוכל לחפש 🔍"
    );
    return;
  }

  const playersMap = getPlayersMap();
  const q = query.toLowerCase();

  const matches = players.filter(function (nick) {
    const full = playersMap[nick] || "";
    return (
      nick.toLowerCase().indexOf(q) !== -1 ||
      String(full).toLowerCase().indexOf(q) !== -1
    );
  });

  if (matches.length === 0) {
    sendMessage(
      chatId,
      "לא מצאתי שחקן שמתאים לטקסט הזה 😅\n" +
      "נסה לכתוב חלק אחר מהניק או מהשם."
    );
    return;
  }

  if (matches.length === 1) {
    const chosen = matches[0];
    selectWinner(state, chosen, null);
    return;
  }

  if (matches.length > 10) {
    sendMessage(
      chatId,
      "יש יותר מדי תוצאות 🤯\n" +
      "תנסה להוסיף עוד אות או שתיים כדי לצמצם."
    );
    return;
  }

  const keyboard = [];
  let row = [];
  matches.forEach(function (nick) {
    row.push({
      text: nick,
      callback_data: "WINNER|" + nick
    });
    if (row.length === 2) {
      keyboard.push(row);
      row = [];
    }
  });
  if (row.length) keyboard.push(row);

  sendMessage(
    chatId,
    "מצאתי כמה אפשרויות למקום " + place + ":\nבחר מהכפתורים 👇",
    { reply_markup: JSON.stringify({ inline_keyboard: keyboard }) }
  );
}

/***************************************************
 * בחירת מנצח - רגיל או באונטי
 ***************************************************/
function selectWinner(state, nickname, callbackId) {
  const chatId = state.chatId;
  const place = state.currentPlace;
  const players = state.remainingPlayers || getAllNicknames();

  const wArr = state.winners || [];
  for (let i = 0; i < wArr.length; i++) {
    if (wArr[i].nickname === nickname && wArr[i].place === place) {
      if (callbackId) {
        answerCallbackQuery(callbackId, "שחקן זה כבר נבחר למקום הזה.");
      }
      return;
    }
  }

  if (players.indexOf(nickname) === -1) {
    if (callbackId) {
      answerCallbackQuery(callbackId, "שחקן לא קיים ברשימה.");
    }
    return;
  }

  state.remainingPlayers = players.filter(function (p) { return p !== nickname; });

  const isBounty = state.tournamentType === "BOUNTY";

  if (isBounty) {
    state.pendingWinner = { place: place, nickname: nickname };
    state.step = "ASK_WINNER_BOUNTY";
    saveState(state);

    if (callbackId) answerCallbackQuery(callbackId);

    sendMessage(
      chatId,
      "נבחר: " + nickname + " למקום " + place + " ✅\n" +
      "כמה באונטי השחקן לקח? אם לא לקח, כתוב 0."
    );
  } else {
    state.winners = state.winners || [];
    state.winners.push({ place: place, nickname: nickname, bounty: 0 });
    state.currentPlace = place + 1;
    state.step = "SELECT_WINNERS";
    saveState(state);

    if (callbackId) answerCallbackQuery(callbackId);

    sendMessage(
      chatId,
      "נבחר: " + nickname + " למקום " + place + " ✅"
    );

    askForNextWinner(state);
  }
}

/***************************************************
 * קבלת באונטי לשחקן זוכה
 ***************************************************/
function handleWinnerBountyInput(state, text) {
  const chatId = state.chatId;

  if (!state.pendingWinner) {
    state.step = "SELECT_WINNERS";
    saveState(state);
    sendMessage(chatId, "איפשהו הלכנו לאיבוד עם הבאונטי 😅 נסה לבחור שוב את השחקן.");
    askForNextWinner(state);
    return;
  }

  const bounty = parseInt(String(text).replace(",", ""), 10);
  if (isNaN(bounty) || bounty < 0) {
    sendMessage(chatId, "סכום באונטי לא תקין. כתוב מספר גדול או שווה ל 0.");
    return;
  }

  const place = state.pendingWinner.place;
  const nick = state.pendingWinner.nickname;

  state.winners = state.winners || [];
  state.winners.push({
    place: place,
    nickname: nick,
    bounty: bounty
  });

  state.pendingWinner = null;
  state.currentPlace = state.currentPlace + 1;
  state.step = "SELECT_WINNERS";
  saveState(state);

  sendMessage(
    chatId,
    "עודכן באונטי של " + bounty + "₪ עבור " + nick + " למקום " + place + "."
  );

  const maxPlaces = state.prizesBase.length;
  if (state.currentPlace > maxPlaces) {
    askExtraBountyQuestion(state);
  } else {
    askForNextWinner(state);
  }
}

/***************************************************
 * באונטי נוספים - מחוץ לפרסים
 ***************************************************/
function askExtraBountyQuestion(state) {
  const chatId = state.chatId;
  if (state.tournamentType !== "BOUNTY") {
    finalizeResults(state);
    return;
  }

  state.step = "ASK_EXTRA_BOUNTY_EXIST";
  saveState(state);

  const kb = {
    inline_keyboard: [
      [
        { text: "כן", callback_data: "EXTRA_BOUNTY_YES" },
        { text: "לא", callback_data: "EXTRA_BOUNTY_NO" }
      ]
    ]
  };

  sendMessage(
    chatId,
    "האם היו שחקנים נוספים שלקחו באונטי?",
    { reply_markup: JSON.stringify(kb) }
  );
}

function handleExtraBountySearchInput(state, text) {
  const chatId = state.chatId;
  const query = (text || "").trim();
  const playersMap = getPlayersMap();
  const allRemaining = state.remainingPlayers || getAllNicknames();

  if (!query || query.length < 2) {
    sendMessage(
      chatId,
      "תכתוב לפחות 2 אותיות מהניק או מהשם כדי שאוכל לחפש 🔍"
    );
    return;
  }

  const q = query.toLowerCase();

  const matches = allRemaining.filter(function (nick) {
    const full = playersMap[nick] || "";
    return (
      nick.toLowerCase().indexOf(q) !== -1 ||
      String(full).toLowerCase().indexOf(q) !== -1
    );
  });

  if (matches.length === 0) {
    sendMessage(
      chatId,
      "לא מצאתי שחקן שמתאים לטקסט הזה 😅\n" +
      "נסה לכתוב חלק אחר מהניק או מהשם."
    );
    return;
  }

  if (matches.length === 1) {
    const chosen = matches[0];
    state.pendingExtraBountyNick = chosen;
    state.step = "ASK_EXTRA_BOUNTY_AMOUNT";
    saveState(state);

    sendMessage(
      chatId,
      "נבחר: " + chosen + ". כמה באונטי השחקן לקח? אם לא לקח, כתוב 0."
    );
    return;
  }

  if (matches.length > 10) {
    sendMessage(
      chatId,
      "יש יותר מדי תוצאות 🤯\n" +
      "תנסה להוסיף עוד אות או שתיים כדי לצמצם."
    );
    return;
  }

  const keyboard = [];
  let row = [];
  matches.forEach(function (nick) {
    row.push({
      text: nick,
      callback_data: "EXTRA_BOUNTY_PICK|" + nick
    });
    if (row.length === 2) {
      keyboard.push(row);
      row = [];
    }
  });
  if (row.length) keyboard.push(row);

  sendMessage(
    chatId,
    "מצאתי כמה שחקנים שלקחו באונטי:\nבחר מהכפתורים 👇",
    { reply_markup: JSON.stringify({ inline_keyboard: keyboard }) }
  );
}

function handleExtraBountyAmountInput(state, text) {
  const chatId = state.chatId;

  if (!state.pendingExtraBountyNick) {
    state.step = "ASK_EXTRA_BOUNTY_EXIST";
    saveState(state);
    askExtraBountyQuestion(state);
    return;
  }

  const bounty = parseInt(String(text).replace(",", ""), 10);
  if (isNaN(bounty) || bounty < 0) {
    sendMessage(chatId, "סכום באונטי לא תקין. כתוב מספר גדול או שווה ל 0.");
    return;
  }

  const nick = state.pendingExtraBountyNick;
  state.extraBounties = state.extraBounties || [];
  state.extraBounties.push({
    nickname: nick,
    bounty: bounty
  });

  state.remainingPlayers = (state.remainingPlayers || []).filter(function (p) {
    return p !== nick;
  });

  state.pendingExtraBountyNick = null;
  state.step = "ASK_EXTRA_BOUNTY_EXIST";
  saveState(state);

  sendMessage(
    chatId,
    "עודכן באונטי של " + bounty + "₪ עבור " + nick + "."
  );

  askExtraBountyQuestion(state);
}

/***************************************************
 * סיכום תוצאות מעוצב
 ***************************************************/
function finalizeResults(state) {
  const chatId = state.chatId;
  const winners = state.winners || [];
  const basePrizes = state.prizesBase || [];

  if (!winners.length || !basePrizes.length) {
    sendMessage(chatId, "לא נבחרו זוכים, אין מה לסכם.");
    resetState(chatId);
    return;
  }

  let finalPrizes;
  if (state.deal && state.dealCount && state.dealCount > 1) {
    finalPrizes = applyDeal(basePrizes, state.dealCount);
  } else {
    finalPrizes = basePrizes.slice();
  }

  const playersMap = getPlayersMap();
  const lines = [];

  let dealText = "לא";
  if (state.deal && state.dealCount && state.dealCount > 0) {
    if (state.dealCount >= winners.length) {
      dealText = "כן - מלא (כל הזוכים)";
    } else {
      dealText = "כן - חלקי (" + state.dealCount + " מתוך " + winners.length + " הזוכים)";
    }
  }

  const gameLine = "סוג משחק: " + (state.gameType || "לא צוין");

  const header =
    "🎯 סיכום הטילט היומי 🎯\n" +
    gameLine + "\n" +
    "👥 שחקנים: " + state.numPlayers + "\n" +
    "💵 כניסה: " + state.buyIn + "₪\n" +
    "🤝 דיל: " + dealText + "\n" +
    "━━━━━━━━━━━━━━━\n" +
    "🏆 טבלת זכיות:\n";

  winners.sort(function (a, b) { return a.place - b.place; });

  const isBounty = state.tournamentType === "BOUNTY";

  winners.forEach(function (w) {
    const place = w.place;
    const nick = w.nickname;
    const full = playersMap[nick] || nick;
    const amount = finalPrizes[place - 1] || 0;
    const bounty = isBounty && typeof w.bounty === "number" ? w.bounty : 0;

    let emoji = "▫️";
    if (place === 1) emoji = "👑";
    else if (place === 2) emoji = "🥈";
    else if (place === 3) emoji = "🥉";
    else if (place === 4) emoji = "💪";

    let prizeText = amount + "₪";
    if (isBounty && bounty > 0) {
      prizeText = amount + "₪ + " + bounty + "₪ באונטי";
    }

    const inDeal =
      state.deal && state.dealCount && place <= state.dealCount
        ? " (בדיל)"
        : "";

    lines.push(
      emoji + " מקום " + place + " - " + full + " (" + nick + ") - " + prizeText + inDeal
    );
  });

  let body = lines.join("\n");

  if (isBounty && state.extraBounties && state.extraBounties.length > 0) {
    const extraLines = [];
    const playersMap2 = getPlayersMap();

    state.extraBounties.forEach(function (b) {
      const nick = b.nickname;
      const full = playersMap2[nick] || nick;
      extraLines.push(
        "- " + full + " (" + nick + ") - " + b.bounty + "₪ באונטי"
      );
    });

    body +=
      "\n\n💣 שחקנים שלקחו באונטי מחוץ לפרסים:\n" +
      extraLines.join("\n");
  }

  const footer = "\n\nתייגו את בעל הפייבוקס @  🙏 תודה";

  const summaryText = header + body + footer;

  const waUrl =
    "https://api.whatsapp.com/send?text=" +
    encodeURIComponent(summaryText.replace(/━━━━━━━━━━━━━━━/g, ""));

  const msg =
    summaryText + "\n\n" +
    '<a href="' + waUrl + '">🔗 שיתוף בוואטסאפ</a>';

  sendMessage(chatId, msg);

  const kb = {
    inline_keyboard: [
      [{ text: "🔁 התחל חישוב זכיות חדש", callback_data: "START_FLOW" }]
    ]
  };

  sendMessage(chatId, "רוצה להתחיל טורניר חדש?", {
    reply_markup: JSON.stringify(kb)
  });

  resetState(chatId);
}

/***************************************************
 * Webhook + Server
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

