import argparse
import random
from typing import List


class Card:현재 카드에 즉시 아이템 능력 실행 해줘

    def __init__(self, rank: str, suit: str | None = None):
        self.rank = rank
        self.suit = suit

    def display(self) -> str:
        if self.rank == "Joker":
            return "🃏 Joker"
        return f"{self.rank}{self.suit or ''}"


def build_deck() -> List[Card]:
    deck: List[Card] = []

    # 15 normal cards
    for rank in ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J"]:
        for suit in ["♠", "♥", "♦", "♣"]:
            deck.append(Card(rank, suit))
            if len(deck) >= 15:
                break
        if len(deck) >= 15:
            break

    # Special cards to make 30 total cards
    for _ in range(6):
        deck.append(Card("A"))
    for _ in range(4):
        deck.append(Card("K"))
    for _ in range(3):
        deck.append(Card("Q"))
    for _ in range(2):
        deck.append(Card("Joker"))

    # If deck has more than 30 cards due to the loop, trim it
    return deck[:30]


def score_for_card(card: Card) -> int:
    if card.rank == "Joker":
        return -1000
    if card.rank == "A":
        return 500
    if card.rank in {"K", "Q"}:
        return 0
    return 100


def play_game(auto: bool = False) -> None:
    deck = build_deck()
    random.shuffle(deck)

    score = 300
    cards_left = len(deck)
    turn = 1

    print("=== 트럼프 카드 점수 게임 ===")
    print("규칙:")
    print("- 기본 점수: 300")
    print("- 일반 카드: +100")
    print("- 에이스: +500")
    print("- 킹/퀸: 카드 하나 더 뽑기")
    print("- 조커: -1000")
    print("- 20장의 카드가 모두 끝나면 게임 종료")
    print()

    while deck and score > 0 and cards_left > 0:
        card = deck.pop()
        cards_left -= 1

        if not auto:
            input("엔터를 눌러 카드를 뒤집어요...")

        print(f"[{turn}] 카드: {card.display()}")

        points = score_for_card(card)
        if card.rank == "Joker":
            score += points
            print(f"조커를 뒤집었습니다! 점수 {points}점 적용")
        elif card.rank == "A":
            score += points
            print(f"에이스! +500점! 현재 점수: {score}")
        elif card.rank in {"K", "Q"}:
            score += 0
            print(f"{card.rank}를 뽑았습니다! 카드 하나를 더 뽑습니다.")
            if deck:
                bonus_card = deck.pop()
                cards_left -= 1
                bonus_points = score_for_card(bonus_card)
                if bonus_points == 0:
                    print(f"보너스 카드: {bonus_card.display()} (추가 카드 뽑기)")
                else:
                    score += bonus_points
                    print(f"보너스 카드: {bonus_card.display()} ({bonus_points:+d}점)")
            else:
                print("더 이상 남은 카드가 없습니다.")
        else:
            score += points
            print(f"일반 카드! +100점! 현재 점수: {score}")

        print(f"남은 카드: {cards_left}장, 현재 점수: {score}")
        print()
        turn += 1

    print("=== 게임 종료 ===")
    print(f"최종 점수: {score}")
    if score <= 0:
        print("점수가 0 이하가 되어 게임이 끝났습니다.")
    else:
        print("모든 카드를 뒤집었습니다.")


def main() -> None:
    parser = argparse.ArgumentParser(description="20장의 트럼프 카드 점수 게임")
    parser.add_argument("--auto", action="store_true", help="입력 없이 자동으로 진행합니다")
    args = parser.parse_args()
    play_game(auto=args.auto)


if __name__ == "__main__":
    main()
