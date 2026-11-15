export interface UnoRules {
  startingHandSize: number;
  allowStacking: boolean;
  allowJumpIn: boolean;
  allowDrawUntilPlayable: boolean;
  drawAfterPlayableCard: boolean;
  unoPenaltyCards: number;
  wildDrawFourChallenge: boolean;
  turnTimeLimit: number | null;
  totalGameTime: number | null;
  minPlayers: number;
  maxPlayers: number;
}

export const classicRules: UnoRules = {
  startingHandSize: 7,
  allowStacking: false,
  allowJumpIn: false,
  allowDrawUntilPlayable: false,
  drawAfterPlayableCard: false,
  unoPenaltyCards: 2,
  minPlayers: 2,
  maxPlayers: 4,
  wildDrawFourChallenge: true,
  turnTimeLimit: 15,
  totalGameTime: 300,
};
