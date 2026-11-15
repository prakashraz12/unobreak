'use client';

import type { MouseEventHandler } from 'react';
import CardBase, { type CardBaseProps } from './card-base';

export interface CardProps extends CardBaseProps {
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  'aria-label'?: string;
}

const Card = ({
  onClick,
  disabled = false,
  'aria-label': ariaLabel,
  ...cardProps
}: CardProps) => {
  if (!onClick) {
    return <CardBase {...cardProps} />;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="block w-fit rounded-xl transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
    >
      <CardBase {...cardProps} />
    </button>
  );
};

export default Card;
