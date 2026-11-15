import type { Card } from '@repo/game-engine';
import type { ActionType } from '../constant';
import type { CardBaseProps } from '../components/cards/card-base';

const ACTION_VALUES: Record<string, ActionType> = {
  skip: 'skip',
  reverse: 'reverse',
  draw2: 'draw-two',
  wild: 'wild',
  wild4: 'wild-draw-four',
};

export const toCardBaseProps = (
  card: Card,
): Pick<CardBaseProps, 'color' | 'value'> => ({
  color: card.color,
  value: /^[0-9]$/.test(card.value)
    ? Number(card.value)
    : ACTION_VALUES[card.value]!,
});
