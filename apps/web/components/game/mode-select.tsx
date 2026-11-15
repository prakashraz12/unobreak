'use client';

import { type ReactNode } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import ModeCard from './mode-card';
import classicMode from '../../assets/menu/classicmode.png';
import duel1v1 from '../../assets/menu/1v1.png';
import soloPlay from '../../assets/menu/solo-play.png';
import playWithFriends from '../../assets/menu/playwithfriends.png';

const VsComputerFace = () => (
  <div className="relative size-full">
    <Image
      src={classicMode}
      alt=""
      fill
      sizes="(max-width: 768px) 180px, 270px"
      className="object-cover"
      draggable={false}
    />
  </div>
);

const SoloFace = () => (
  <div className="relative size-full">
    <Image
      src={soloPlay}
      alt=""
      fill
      sizes="(max-width: 768px) 180px, 270px"
      className="object-cover"
      draggable={false}
    />
  </div>
);

const FriendsFace = () => (
  <div className="relative size-full">
    <Image
      src={playWithFriends}
      alt=""
      fill
      sizes="(max-width: 768px) 180px, 270px"
      className="object-cover"
      draggable={false}
    />
  </div>
);

const DuelFace = () => (
  <div className="relative size-full">
    <Image
      src={duel1v1}
      alt=""
      fill
      sizes="(max-width: 768px) 140px, 210px"
      className="object-cover"
      draggable={false}
    />
  </div>
);

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 60, rotate: -6 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: {
      delay: 0.08 * i,
      type: 'spring',
      stiffness: 260,
      damping: 20,
    },
  }),
};

interface ModeSelectProps {
  onVsComputer: () => void;
  onSolo: () => void;
  onFriends: () => void;
  onCustom?: () => void;
  onDuel?: () => void;
  soloLoading?: boolean;
}

const ModeSelect = ({
  onVsComputer,
  onSolo,
  onFriends,
  onDuel,
  soloLoading = false,
}: ModeSelectProps) => {
  const reducedMotion = useReducedMotion();

  const modes: {
    key: string;
    title: ReactNode;
    onClick?: () => void;
    face: ReactNode;
    loading?: boolean;
    bare?: boolean;
  }[] = [
    {
      key: 'vs-computer',
      title: null,
      onClick: onVsComputer,
      face: <VsComputerFace />,
      bare: true,
    },
    {
      key: 'solo',
      title: null,
      onClick: onSolo,
      loading: soloLoading,
      face: <SoloFace />,
      bare: true,
    },
    {
      key: 'friends',
      title: null,
      onClick: onFriends,
      face: <FriendsFace />,
      bare: true,
    },
    {
      key: '1v1',
      title: null,
      onClick: onDuel,
      face: <DuelFace />,
      bare: true,
    },
  ];

  return (
    <div className="flex flex-1 flex-wrap items-center justify-center gap-2 px-4 pb-8">
      {modes.map((mode, i) => (
        <motion.div
          key={mode.key}
          custom={i}
          variants={cardVariants}
          initial={reducedMotion ? 'show' : 'hidden'}
          animate="show"
        >
          <ModeCard
            label={mode.title}
            onClick={mode.onClick}
            loading={mode.loading}
            bare={mode.bare}
          >
            {mode.face}
          </ModeCard>
        </motion.div>
      ))}
    </div>
  );
};

export default ModeSelect;
