import { GRID_SIZE } from '../constants';
import { Tile, Direction } from '../types';

let uniqueIdCounter = 0;
const generateId = () => `tile_${Date.now()}_${uniqueIdCounter++}`;

export const getEmptyCells = (tiles: Tile[]) => {
  const cells: { r: number; c: number }[] = [];
  const occupied = new Set(tiles.map(t => `${t.r},${t.c}`));

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!occupied.has(`${r},${c}`)) {
        cells.push({ r, c });
      }
    }
  }
  return cells;
};

export const spawnTile = (tiles: Tile[]): Tile[] => {
  const emptyCells = getEmptyCells(tiles);
  if (emptyCells.length === 0) return tiles;

  const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const value = Math.random() < 0.9 ? 2 : 4;

  return [
    ...tiles,
    {
      id: generateId(),
      value,
      r: randomCell.r,
      c: randomCell.c,
      isNew: true,
      isMerged: false,
    },
  ];
};

export const initializeGame = (): { tiles: Tile[]; score: number } => {
  let tiles: Tile[] = [];
  tiles = spawnTile(tiles);
  tiles = spawnTile(tiles);
  return { tiles, score: 0 };
};

type MoveResult = {
  tiles: Tile[];
  scoreIncrease: number;
  moved: boolean;
};

export const moveTiles = (tiles: Tile[], direction: Direction): MoveResult => {
  // Deep clone to avoid mutating state directly during calculation
  let nextTiles = tiles.map(t => ({ ...t, isNew: false, isMerged: false, mergedFrom: undefined }));
  let scoreIncrease = 0;
  let moved = false;

  // We process row by row or col by col depending on direction
  const isVertical = direction === 'UP' || direction === 'DOWN';
  const isAscending = direction === 'LEFT' || direction === 'UP'; // 0 -> 3

  for (let i = 0; i < GRID_SIZE; i++) {
    // Get tiles in this specific row/col
    const lineTiles = nextTiles.filter(t => (isVertical ? t.c === i : t.r === i));
    
    // Sort them based on position to process them in order
    lineTiles.sort((a, b) => {
      const posA = isVertical ? a.r : a.c;
      const posB = isVertical ? b.r : b.c;
      return isAscending ? posA - posB : posB - posA;
    });

    let target = isAscending ? 0 : GRID_SIZE - 1;
    let mergeTarget: Tile | null = null;

    for (const tile of lineTiles) {
      const currentPos = isVertical ? tile.r : tile.c;
      
      // Calculate desired position
      let newPos = target;

      if (mergeTarget && mergeTarget.value === tile.value) {
        // MERGE HAPPENS
        
        if (isVertical) tile.r = mergeTarget.r;
        else tile.c = mergeTarget.c;

        mergeTarget.value *= 2;
        mergeTarget.isMerged = true;
        
        scoreIncrease += mergeTarget.value;
        
        const tileIndex = nextTiles.findIndex(t => t.id === tile.id);
        if(tileIndex > -1) nextTiles.splice(tileIndex, 1);
        
        mergeTarget = null; // Can't merge twice in one cell
        moved = true; // A merge counts as a move
      } else {
        // NO MERGE, JUST SLIDE
        if (currentPos !== newPos) {
          if (isVertical) tile.r = newPos;
          else tile.c = newPos;
          moved = true;
        }

        mergeTarget = tile; // This tile is now a candidate for merging
        
        // Prepare next target position
        if (isAscending) target++;
        else target--;
      }
    }
  }

  return { tiles: nextTiles, scoreIncrease, moved };
};

export const checkGameOver = (tiles: Tile[]): boolean => {
  if (tiles.length < GRID_SIZE * GRID_SIZE) return false; // Has empty space

  // Check for adjacent matches
  for (const tile of tiles) {
    // Check right
    const right = tiles.find(t => t.r === tile.r && t.c === tile.c + 1);
    if (right && right.value === tile.value) return false;

    // Check down
    const down = tiles.find(t => t.r === tile.r + 1 && t.c === tile.c);
    if (down && down.value === tile.value) return false;
  }

  return true;
};

// Power-up Logic

export const eliminateTile = (tiles: Tile[], tileId: string): Tile[] => {
  return tiles.filter(t => t.id !== tileId);
};

export const swapTiles = (tiles: Tile[], tileId1: string, tileId2: string): Tile[] => {
  const t1Index = tiles.findIndex(t => t.id === tileId1);
  const t2Index = tiles.findIndex(t => t.id === tileId2);

  if (t1Index === -1 || t2Index === -1) return tiles;

  const newTiles = tiles.map(t => ({ ...t })); // Shallow clone
  const t1 = newTiles[t1Index];
  const t2 = newTiles[t2Index];

  // Swap coordinates
  const tempR = t1.r;
  const tempC = t1.c;
  
  t1.r = t2.r;
  t1.c = t2.c;
  
  t2.r = tempR;
  t2.c = tempC;

  return newTiles;
};


// Helper to convert tiles to a 2D matrix for the AI
export const tilesToMatrix = (tiles: Tile[]): number[][] => {
  const matrix = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));
  tiles.forEach(t => {
    matrix[t.r][t.c] = t.value;
  });
  return matrix;
};
