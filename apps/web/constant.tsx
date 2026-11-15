type CardColor = 'red' | 'blue' | 'green' | 'yellow';

type CardType = 'number' | 'action' | 'wild';

type ActionType = 'skip' | 'reverse' | 'draw-two' | 'wild' | 'wild-draw-four';

interface UnoCard {
  id: string;
  color: CardColor | null;
  value: number | ActionType;
  type: CardType;
}

const unoDeck: UnoCard[] = [];

const colors: CardColor[] = ['red', 'blue', 'green', 'yellow'];

// Generate colored cards
for (const color of colors) {
  // One zero card per color
  unoDeck.push({
    id: `${color}-0`,
    color,
    value: 0,
    type: 'number',
  });

  // Two copies of 1-9 per color
  for (let number = 1; number <= 9; number++) {
    for (let copy = 1; copy <= 2; copy++) {
      unoDeck.push({
        id: `${color}-${number}-${copy}`,
        color,
        value: number,
        type: 'number',
      });
    }
  }

  // Two copies of each action card per color
  const actions: ActionType[] = ['skip', 'reverse', 'draw-two'];

  for (const action of actions) {
    for (let copy = 1; copy <= 2; copy++) {
      unoDeck.push({
        id: `${color}-${action}-${copy}`,
        color,
        value: action,
        type: 'action',
      });
    }
  }
}

// Wild cards: 4 each
const wildCards: ActionType[] = ['wild', 'wild-draw-four'];

for (const action of wildCards) {
  for (let copy = 1; copy <= 4; copy++) {
    unoDeck.push({
      id: `${action}-${copy}`,
      color: null,
      value: action,
      type: 'wild',
    });
  }
}

export { unoDeck, colors };
export type { CardColor, CardType, ActionType, UnoCard };
