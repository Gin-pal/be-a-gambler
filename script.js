const scoreEl = document.getElementById("score");
const remainingEl = document.getElementById("remaining");
const cardBackEl = document.getElementById("current-card");
const cardContainer = document.getElementById("card");
const messageEl = document.getElementById("message");
const logEl = document.getElementById("log");
const flipBtn = document.getElementById("flipBtn");
const autoBtn = document.getElementById("autoBtn");
const restartBtn = document.getElementById("restartBtn");

let deck = [];
let score = 300;
let autoMode = false;
let running = false;
let peekUsedCount = 0;
let replaceUsedCount = 0;
const PEEK_COST = 500;
const PEEK_LIMIT = 3;
const REPLACE_COST = 300;
const REPLACE_LIMIT = 5;

function buildDeck() {
  const deck = [];
  const normalRanks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J"];
  for (const rank of normalRanks) {
    for (const suit of ["♠", "♥", "♦", "♣"]) {
      deck.push({ rank, suit });
      if (deck.length >= 15) break;
    }
    if (deck.length >= 15) break;
  }

  for (let i = 0; i < 6; i += 1) deck.push({ rank: "A" });
  for (let i = 0; i < 4; i += 1) deck.push({ rank: "K" });
  for (let i = 0; i < 3; i += 1) deck.push({ rank: "Q" });
  for (let i = 0; i < 2; i += 1) deck.push({ rank: "Joker" });
  return deck.slice(0, 30);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function scoreForCard(card) {
  if (card.rank === "Joker") return -1000;
  if (card.rank === "A") return 500;
  if (card.rank === "K" || card.rank === "Q") return 0;
  return 100;
}

function displayCard(card) {
  if (card.rank === "Joker") return "🃏 Joker";
  return `${card.rank}${card.suit ?? ""}`;
}

function updateUI() {
  scoreEl.textContent = score;
  remainingEl.textContent = deck.length;
  updateShopUI();
}

function updateShopUI() {
  const peekBtn = document.getElementById("peekBtn");
  const replaceBtn = document.getElementById("replaceBtn");
  document.getElementById("peekUsed").textContent = peekUsedCount;
  document.getElementById("replaceUsed").textContent = replaceUsedCount;
  
  peekBtn.disabled = !running || peekUsedCount >= PEEK_LIMIT || score < PEEK_COST;
  replaceBtn.disabled = !running || replaceUsedCount >= REPLACE_LIMIT || score < REPLACE_COST;
}

function logLine(text) {
  const line = document.createElement("div");
  line.className = "log-item";
  line.textContent = text;
  logEl.prepend(line);
}

function finishGame(reason) {
  running = false;
  flipBtn.disabled = true;
  autoBtn.disabled = false;
  messageEl.textContent = reason;
  logLine(`게임 종료: ${reason}`);
}

function handleCard(card) {
  const display = displayCard(card);
  cardBackEl.textContent = display;
  let points = scoreForCard(card);

  if (card.rank === "Joker") {
    score += points;
    messageEl.textContent = `조커를 뒤집었습니다! ${points}점 적용.`;
    logLine(`[카드] ${display} → ${points}점, 남은 카드 ${deck.length}, 점수 ${score}`);
  } else if (card.rank === "A") {
    score += points;
    messageEl.textContent = `에이스! +500점! 현재 점수: ${score}`;
    logLine(`[카드] ${display} → +500점, 점수 ${score}`);
  } else if (card.rank === "K" || card.rank === "Q") {
    messageEl.textContent = `${card.rank}를 뽑았습니다! 카드 하나를 더 뽑습니다.`;
    logLine(`[카드] ${display} → 추가 카드 뽑기, 남은 카드 ${deck.length}, 점수 ${score}`);
    if (deck.length > 0) {
      const bonusCard = deck.pop();
      const bonusPoints = scoreForCard(bonusCard);
      const bonusDisplay = displayCard(bonusCard);
      if (bonusPoints === 0) {
        messageEl.textContent = `보너스 카드 ${bonusDisplay} (추가 카드 뽑기)`;
        logLine(`[보너스] ${bonusDisplay} → 추가 카드 뽑기, 점수 ${score}`);
        handleCard(bonusCard);
        return;
      }
      score += bonusPoints;
      messageEl.textContent = `보너스 카드 ${bonusDisplay} ${bonusPoints >= 0 ? "+" : ""}${bonusPoints}점! 현재 점수: ${score}`;
      logLine(`[보너스] ${bonusDisplay} → ${bonusPoints >= 0 ? "+" : ""}${bonusPoints}점, 점수 ${score}`);
    } else {
      messageEl.textContent = "더 이상 남은 카드가 없습니다.";
      logLine("보너스 카드 없음, 덱 비어있음");
    }
  } else {
    score += points;
    messageEl.textContent = `일반 카드 ${display}! +100점! 현재 점수: ${score}`;
    logLine(`[카드] ${display} → +100점, 점수 ${score}`);
  }

  updateUI();

  if (score <= 0) {
    finishGame("점수가 0 이하가 되어 게임이 끝났습니다.");
    return;
  }

  if (deck.length === 0) {
    finishGame("모든 카드를 뒤집었습니다.");
  }
}

function flipCard() {
  if (!running || deck.length === 0) return;
  const card = deck.pop();
  if (cardContainer) cardContainer.classList.add("is-flipped");
  setTimeout(() => {
    handleCard(card);
  }, 380);
}

function peekCard() {
  if (!running || peekUsedCount >= PEEK_LIMIT || score < PEEK_COST || deck.length === 0) return;
  score -= PEEK_COST;
  peekUsedCount += 1;
  const nextCard = deck[deck.length - 1];
  const display = displayCard(nextCard);
  messageEl.textContent = `다음 카드는 ${display}입니다!`;
  logLine(`[상점] 카드 확인 (${display}) - 점수 -${PEEK_COST}점`);
  updateUI();
}

function replaceCard() {
  if (!running || replaceUsedCount >= REPLACE_LIMIT || score < REPLACE_COST || deck.length === 0) return;
  score -= REPLACE_COST;
  replaceUsedCount += 1;
  const oldIndex = deck.length - 1;
  const allCards = buildDeck();
  shuffle(allCards);
  const newCard = allCards[0];
  deck[oldIndex] = newCard;
  const display = displayCard(newCard);
  messageEl.textContent = `다음 카드가 ${display}(으)로 교체되었습니다!`;
  logLine(`[상점] 카드 교체 - 점수 -${REPLACE_COST}점`);
  updateUI();
}

function autoPlay() {
  if (!running) return;
  let timeout = 0;
  while (running && deck.length > 0 && score > 0) {
    setTimeout(() => {
      if (!running) return;
      flipCard();
    }, timeout);
    timeout += 500;
    if (timeout > 10000) break;
  }
}

function startGame() {
  deck = buildDeck();
  shuffle(deck);
  score = 300;
  running = true;
  peekUsedCount = 0;
  replaceUsedCount = 0;
  flipBtn.style.display = 'none';
  autoBtn.disabled = false;
  if (cardContainer) cardContainer.classList.remove("is-flipped");
  if (cardBackEl) cardBackEl.textContent = "-";
  messageEl.textContent = "게임이 시작되었습니다. 카드를 뒤집어 보세요.";
  logEl.innerHTML = "";
  updateUI();
  logLine("새 게임 시작");
}

flipBtn.addEventListener("click", () => {
  flipCard();
});

if (cardContainer) {
  cardContainer.addEventListener('click', () => {
    if (!running || deck.length === 0) return;
    flipCard();
  });
}

autoBtn.addEventListener("click", () => {
  autoMode = !autoMode;
  if (autoMode) {
    autoBtn.textContent = "자동 진행 중...";
    flipBtn.disabled = true;
    logLine("자동 진행 시작");
    let interval = setInterval(() => {
      if (!running || deck.length === 0 || score <= 0) {
        clearInterval(interval);
        autoMode = false;
        autoBtn.textContent = "자동 진행";
        flipBtn.disabled = !running;
        return;
      }
      flipCard();
    }, 600);
  } else {
    autoBtn.textContent = "자동 진행";
    flipBtn.disabled = false;
  }
});

restartBtn.addEventListener("click", () => {
  autoMode = false;
  autoBtn.textContent = "자동 진행";
  startGame();
});

document.getElementById("peekBtn").addEventListener("click", () => {
  peekCard();
});

document.getElementById("replaceBtn").addEventListener("click", () => {
  replaceCard();
});

startGame();
