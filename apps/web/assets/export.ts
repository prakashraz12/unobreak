//sounds
export const SOUNDS = {
  cardPull: '/sounds/card-pull.mp3',
  deal: '/sounds/deal.mp3',
  timeOver: '/sounds/time-over.wav',
  uno: '/sounds/uno.mp3',
  red: '/sounds/red.mp3',
  yellow: '/sounds/yellow.mp3',
  green: '/sounds/green.mp3',
  blue: '/sounds/blue.mp3',
  nice: '/sounds/nice.mp3',
  notBad: '/sounds/notbad.mp3',
  ohNo: '/sounds/ohno.mp3',
  hurryUp: '/sounds/hurryup.mp3',
  skip: '/sounds/skip.mp3',
  drawTwo: '/sounds/brought2.mp3',
  drawFour: '/sounds/brought4.mp3',
  bgMusic: '/sounds/bgmusic.mp3',
} as const;

export type SoundName = keyof typeof SOUNDS;

export const playSound = (name: SoundName, volume = 1): void => {
  if (typeof window === 'undefined') return;
  const audio = new Audio(SOUNDS[name]);
  audio.volume = volume;
  void audio.play().catch(() => {});
};

export const loopSound = (name: SoundName, volume = 1): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  const audio = new Audio(SOUNDS[name]);
  audio.loop = true;
  audio.volume = volume;
  void audio.play().catch(() => {});
  return () => {
    audio.pause();
    audio.currentTime = 0;
  };
};
