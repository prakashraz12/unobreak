//sounds
export const SOUNDS = {
  cardPull: '/sounds/card-pull.mp3',
  timeOver: '/sounds/time-over.wav',
} as const;

export type SoundName = keyof typeof SOUNDS;

export const playSound = (name: SoundName, volume = 1): void => {
  if (typeof window === 'undefined') return;
  const audio = new Audio(SOUNDS[name]);
  audio.volume = volume;
  void audio.play().catch(() => {});
};
