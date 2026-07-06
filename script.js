const scoreEl = document.getElementById("score");
const remainingEl = document.getElementById("remaining");
const cardBackEl = document.getElementById("current-card");
const cardContainer = document.getElementById("card");
const messageEl = document.getElementById("message");
const logEl = document.getElementById("log");
const flipBtn = document.getElementById("flipBtn");
const autoBtn = document.getElementById("autoBtn");
const restartBtn = document.getElementById("restartBtn");
const cardGrid = document.getElementById("cardGrid");
const peekBtn = document.getElementById("peekBtn");
const replaceBtn = document.getElementById("replaceBtn");
const peekUsedEl = document.getElementById("peekUsed");
const replaceUsedEl = document.getElementById("replaceUsed");

const TOTAL_CARDS = 30;
const PEEK_COST = 500;
const REPLACE_COST = 300;
const PEEK_LIMIT = 3;
const REPLACE_LIMIT = 5;
let deck = [];
let fullDeck = [];
let score = 300;
let autoMode = false;
let running = false;
let revealedCards = [];
let currentCard = null;
let peekUsed = 0;
let replaceUsed = 0;

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

  return deck.slice(0, TOTAL_CARDS);
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

function renderCardGrid() {
  if (!cardGrid) return;

  cardGrid.innerHTML = "";
  fullDeck.forEach((card) => {
    const isRevealed = revealedCards.includes(card);
    const cardEl = document.createElement("div");
    cardEl.className = `mini-card${isRevealed ? " revealed" : ""}`;
    cardEl.innerHTML = `<div class="mini-face">${isRevealed ? displayCard(card) : "🂠"}</div>`;
    cardGrid.appendChild(cardEl);
  });
}

function updateUI() {
  if (scoreEl) scoreEl.textContent = score;
  if (remainingEl) remainingEl.textContent = deck.length;
}

function updateShopUI() {
  if (peekUsedEl) peekUsedEl.textContent = peekUsed;
  if (replaceUsedEl) replaceUsedEl.textContent = replaceUsed;

  if (peekBtn) {
    peekBtn.disabled = !running || peekUsed >= PEEK_LIMIT || score < PEEK_COST;
  }
  if (replaceBtn) {
    replaceBtn.disabled = !running || replaceUsed >= REPLACE_LIMIT || score < REPLACE_COST;
  }
}

function logLine(text) {
  const line = document.createElement("div");
  line.className = "log-item";
  line.textContent = text;
  if (logEl) logEl.prepend(line);
}

function finishGame(reason) {
  running = false;
  if (flipBtn) flipBtn.disabled = true;
  if (autoBtn) autoBtn.disabled = true;
  updateShopUI();
  if (messageEl) messageEl.textContent = reason;
  logLine(`게임 종료: ${reason}`);
}

function handleCard(card) {
  currentCard = card;
  const display = displayCard(card);
  if (cardBackEl) cardBackEl.textContent = display;

  const points = scoreForCard(card);

  if (card.rank === "Joker") {
    score += points;
    if (messageEl) messageEl.textContent = `조커를 뒤집었습니다! ${points}점 적용.`;
    logLine(`[카드] ${display} → ${points}점, 남은 카드 ${deck.length}, 점수 ${score}`);
  } else if (card.rank === "A") {
    score += points;
    if (messageEl) messageEl.textContent = `에이스! +500점! 현재 점수: ${score}`;
    logLine(`[카드] ${display} → +500점, 점수 ${score}`);
  } else if (card.rank === "K" || card.rank === "Q") {
    if (messageEl) messageEl.textContent = `${card.rank}를 뽑았습니다! 카드 하나를 더 뽑습니다.`;
    logLine(`[카드] ${display} → 추가 카드 뽑기, 남은 카드 ${deck.length}, 점수 ${score}`);

    if (deck.length > 0) {
      const bonusCard = deck.pop();
      revealedCards.push(bonusCard);
      renderCardGrid();
      const bonusPoints = scoreForCard(bonusCard);
      const bonusDisplay = displayCard(bonusCard);

      if (bonusPoints === 0) {
        if (messageEl) messageEl.textContent = `보너스 카드 ${bonusDisplay} (추가 카드 뽑기)`;
        logLine(`[보너스] ${bonusDisplay} → 추가 카드 뽑기, 점수 ${score}`);
        handleCard(bonusCard);
        return;
      }

      score += bonusPoints;
      if (messageEl) messageEl.textContent = `보너스 카드 ${bonusDisplay} ${bonusPoints >= 0 ? "+" : ""}${bonusPoints}점! 현재 점수: ${score}`;
      logLine(`[보너스] ${bonusDisplay} → ${bonusPoints >= 0 ? "+" : ""}${bonusPoints}점, 점수 ${score}`);
    } else {
      if (messageEl) messageEl.textContent = "더 이상 남은 카드가 없습니다.";
      logLine("보너스 카드 없음, 덱 비어있음");
    }
  } else {
    score += points;
    if (messageEl) messageEl.textContent = `일반 카드 ${display}! +100점! 현재 점수: ${score}`;
    logLine(`[카드] ${display} → +100점, 점수 ${score}`);
  }

  updateUI();
  updateShopUI();

  if (score <= 0) {
    finishGame("점수가 0 이하가 되어 게임이 끝났습니다.");
    return;
  }

  if (deck.length === 0) {
    finishGame("모든 카드를 뒤집었습니다.");
  }
}

function applyPeekEffect() {
  if (!running) return;
  if (!currentCard) {
    if (messageEl) messageEl.textContent = "현재 카드가 없습니다.";
    return;
  }
  if (peekUsed >= PEEK_LIMIT) {
    if (messageEl) messageEl.textContent = "카드 확인은 더 이상 사용할 수 없습니다.";
    return;
  }
  if (score < PEEK_COST) {
    if (messageEl) messageEl.textContent = `카드 확인은 ${PEEK_COST}점이 필요합니다.`;
    return;
  }

  score -= PEEK_COST;
  peekUsed += 1;
  const nextCard = deck[deck.length - 1];
  const nextDisplay = nextCard ? displayCard(nextCard) : "없음";

  if (messageEl) messageEl.textContent = `카드 확인! 현재 카드: ${displayCard(currentCard)} / 다음 카드: ${nextDisplay}`;
  logLine(`[아이템] 카드 확인 사용 → 다음 카드 ${nextDisplay}`);
  updateUI();
  updateShopUI();
}

function applyReplaceEffect() {
  if (!running) return;
  if (!currentCard) {
    if (messageEl) messageEl.textContent = "현재 카드가 없습니다.";
    return;
  }
  if (replaceUsed >= REPLACE_LIMIT) {
    if (messageEl) messageEl.textContent = "카드 교체는 더 이상 사용할 수 없습니다.";
    return;
  }
  if (score < REPLACE_COST) {
    if (messageEl) messageEl.textContent = `카드 교체는 ${REPLACE_COST}점이 필요합니다.`;
    return;
  }
  if (deck.length === 0) {
    if (messageEl) messageEl.textContent = "교체할 카드가 더 없습니다.";
    return;
  }

  score -= REPLACE_COST;
  replaceUsed += 1;
  const replacement = deck.pop();
  currentCard = replacement;
  revealedCards.push(replacement);
  renderCardGrid();

  if (cardBackEl) cardBackEl.textContent = displayCard(currentCard);
  if (messageEl) messageEl.textContent = `카드 교체! 현재 카드가 ${displayCard(currentCard)}로 바뀌었습니다.`;
  logLine(`[아이템] 카드 교체 사용 → ${displayCard(currentCard)}`);
  updateUI();
  updateShopUI();
}

function flipCard() {
  if (!running || deck.length === 0) return;

  const card = deck.pop();
  currentCard = card;
  revealedCards.push(card);
  renderCardGrid();

  if (cardContainer) cardContainer.classList.add("is-flipped");
  setTimeout(() => {
    handleCard(card);
  }, 380);
}

function stopAutoPlay() {
  autoMode = false;
  if (autoBtn) autoBtn.textContent = "자동 진행";
  if (flipBtn) flipBtn.disabled = false;
}

function autoPlay() {
  if (!running) return;

  autoMode = true;
  if (autoBtn) autoBtn.textContent = "자동 진행 중...";
  if (flipBtn) flipBtn.disabled = true;

  const intervalId = setInterval(() => {
    if (!running || deck.length === 0 || score <= 0) {
      clearInterval(intervalId);
      stopAutoPlay();
      return;
    }
    flipCard();
  }, 600);
}

function startGame() {
  fullDeck = buildDeck();
  deck = [...fullDeck];
  shuffle(deck);
  score = 300;
  running = true;
  autoMode = false;
  revealedCards = [];
  currentCard = null;
  peekUsed = 0;
  replaceUsed = 0;

  if (flipBtn) {
    flipBtn.disabled = false;
    flipBtn.style.display = "inline-block";
  }
  if (autoBtn) {
    autoBtn.disabled = false;
    autoBtn.textContent = "자동 진행";
  }
  if (cardContainer) cardContainer.classList.remove("is-flipped");
  if (cardBackEl) cardBackEl.textContent = "-";
  if (messageEl) messageEl.textContent = "게임이 시작되었습니다. 카드를 뒤집어 보세요.";
  if (logEl) logEl.innerHTML = "";

  renderCardGrid();
  updateUI();
  updateShopUI();
  logLine("새 게임 시작");
}

if (flipBtn) {
  flipBtn.addEventListener("click", () => {
    flipCard();
  });
}

if (autoBtn) {
  autoBtn.addEventListener("click", () => {
    if (!running) {
      startGame();
    }
    if (autoMode) {
      stopAutoPlay();
    } else {
      autoPlay();
    }
  });
}

if (restartBtn) {
  restartBtn.addEventListener("click", () => {
    startGame();
  });
}

if (cardContainer) {
  cardContainer.addEventListener("click", () => {
    if (!running || deck.length === 0) return;
    flipCard();
  });
}

if (peekBtn) {
  peekBtn.addEventListener("click", applyPeekEffect);
}

if (replaceBtn) {
  replaceBtn.addEventListener("click", applyReplaceEffect);
}

startGame();
