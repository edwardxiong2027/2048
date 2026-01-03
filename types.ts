export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Tile {
  id: string; // Unique identifier for React keys and animation
  value: number;
  r: number; // Row index (0-3)
  c: number; // Column index (0-3)
  isNew?: boolean; // For spawn animation
  isMerged?: boolean; // For merge pulse animation
}

export interface GameState {
  tiles: Tile[];
  score: number;
  bestScore: number;
  status: 'playing' | 'won' | 'lost';
  history: { tiles: Tile[]; score: number }[]; // For Undo functionality
  hasWon: boolean; // Tracks if 2048 was reached and acknowledged
}

export interface GridCell {
  r: number;
  c: number;
}

export interface AIHintResponse {
  direction: Direction;
  reason: string;
}

export type GameMode = 'classic' | 'fun';
export type InteractionMode = 'none' | 'swap_select_1' | 'swap_select_2' | 'eliminate';

export type GridSize = 4 | 5 | 6;
