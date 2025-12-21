import { Direction, GridSize } from "./types";

export const GRID_SIZES: GridSize[] = [4, 5, 6];
export const WINNING_SCORE = 2048;

// Map values to colors (Tailwind classes or hex for dynamic styling)
export const TILE_COLORS: Record<string | number, string> = {
  2: 'bg-white text-slate-900 shadow-[0_0_10px_rgba(255,255,255,0.2)]',
  4: 'bg-yellow-100 text-slate-900 shadow-[0_0_10px_rgba(253,224,71,0.3)]',
  8: 'bg-orange-200 text-slate-900 shadow-[0_0_15px_rgba(253,186,116,0.4)]',
  16: 'bg-orange-400 text-white shadow-[0_0_15px_rgba(251,146,60,0.5)]',
  32: 'bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.6)]',
  64: 'bg-orange-600 text-white shadow-[0_0_20px_rgba(234,88,12,0.6)]',
  128: 'bg-yellow-400 text-white shadow-[0_0_25px_rgba(250,204,21,0.6)]',
  256: 'bg-yellow-500 text-white shadow-[0_0_25px_rgba(234,179,8,0.7)]',
  512: 'bg-yellow-600 text-white shadow-[0_0_30px_rgba(202,138,4,0.8)]',
  1024: 'bg-yellow-700 text-white shadow-[0_0_30px_rgba(161,98,7,0.8)]',
  2048: 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-[0_0_40px_rgba(236,72,153,0.9)]',
  // Fallback for higher numbers
  super: 'bg-slate-900 text-white border border-purple-500 shadow-[0_0_20px_rgba(168,85,247,1)]',
};

export const DIRECTION_VECTORS: Record<Direction, { r: number; c: number }> = {
  UP: { r: -1, c: 0 },
  DOWN: { r: 1, c: 0 },
  LEFT: { r: 0, c: -1 },
  RIGHT: { r: 0, c: 1 },
};