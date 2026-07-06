const scoreEl = document.getElementById("score");
const remainingEl = document.getElementById("remaining");
const messageEl = document.getElementById("message");
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
  for (let index = 0; index < TOTAL_CARDS; index += 1) {
    const revealedCard = revealedCards[index];
    const isRevealed = Boolean(revealedCard);
    const cardEl = document.createElement("div");
    cardEl.className = `mini-card${isRevealed ? " revealed" : ""}`;
    cardEl.dataset.index = index;
    cardEl.innerHTML = `<div class="mini-face">${isRevealed ? displayCard(revealedCard) : "🂠"}</div>`;

    cardEl.addEventListener("click", () => {
      if (!running || isRevealed || deck.length === 0) return;
      flipCard(index);
    });

    cardGrid.appendChild(cardEl);
  }
}

function revealCardAtSlot(slotIndex = -1) {
  const targetIndex = slotIndex >= 0 ? slotIndex : revealedCards.findIndex((card) => card === null);
  if (targetIndex < 0 || revealedCards[targetIndex]) return null;
  if (deck.length === 0) return null;

  const card = deck.pop();
  revealedCards[targetIndex] = card;
  renderCardGrid();
  return card;
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

function finishGame(reason) {
  running = false;
  updateShopUI();
  if (messageEl) messageEl.textContent = reason;
}

function handleCard(card) {
  currentCard = card;
  const display = displayCard(card);
  const points = scoreForCard(card);

  if (card.rank === "Joker") {
    score += points;
    if (messageEl) messageEl.textContent = `조커를 뒤집었습니다! ${points}점 적용.`;
  } else if (card.rank === "A") {
    score += points;
    if (messageEl) messageEl.textContent = `에이스! +500점! 현재 점수: ${score}`;
  } else if (card.rank === "K" || card.rank === "Q") {
    if (messageEl) messageEl.textContent = `${card.rank}를 뽑았습니다! 카드 하나를 더 뽑습니다.`;

    if (deck.length > 0) {
      const bonusCard = revealCardAtSlot();
      if (!bonusCard) {
        if (messageEl) messageEl.textContent = "더 이상 남은 카드가 없습니다.";
        return;
      }
      const bonusPoints = scoreForCard(bonusCard);
      const bonusDisplay = displayCard(bonusCard);

      if (bonusPoints === 0) {
        if (messageEl) messageEl.textContent = `보너스 카드 ${bonusDisplay} (추가 카드 뽑기)`;
        handleCard(bonusCard);
        return;
      }

      score += bonusPoints;
      if (messageEl) messageEl.textContent = `보너스 카드 ${bonusDisplay} ${bonusPoints >= 0 ? "+" : ""}${bonusPoints}점! 현재 점수: ${score}`;
    } else {
      if (messageEl) messageEl.textContent = "더 이상 남은 카드가 없습니다.";
    }
  } else {
    score += points;
    if (messageEl) messageEl.textContent = `일반 카드 ${display}! +100점! 현재 점수: ${score}`;
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
  const replacement = revealCardAtSlot();
  if (!replacement) {
    if (messageEl) messageEl.textContent = "교체할 카드가 더 없습니다.";
    return;
  }
  currentCard = replacement;

  if (messageEl) messageEl.textContent = `카드 교체! 현재 카드가 ${displayCard(currentCard)}로 바뀌었습니다.`;
  updateUI();
  updateShopUI();
}

function flipCard(slotIndex = -1) {
  if (!running || deck.length === 0) return;

  const card = revealCardAtSlot(slotIndex);
  if (!card) return;

  currentCard = card;
  handleCard(card);
}

function startGame() {
  fullDeck = buildDeck();
  deck = [...fullDeck];
  shuffle(deck);
  score = 300;
  running = true;
  revealedCards = Array(TOTAL_CARDS).fill(null);
  currentCard = null;
  peekUsed = 0;
  replaceUsed = 0;

  if (messageEl) messageEl.textContent = "게임이 시작되었습니다. 카드를 클릭해 보세요.";

  renderCardGrid();
  updateUI();
  updateShopUI();
}

if (peekBtn) {
  peekBtn.addEventListener("click", applyPeekEffect);
}

if (replaceBtn) {
  replaceBtn.addEventListener("click", applyReplaceEffect);
}

startGame();
