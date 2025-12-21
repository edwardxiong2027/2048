import React from 'react';
import Tile from './Tile';
import { Tile as TileType, InteractionMode, GridSize } from '../types';

interface BoardProps {
  tiles: TileType[];
  gridSize: GridSize;
  interactionMode: InteractionMode;
  selectedTileId: string | null;
  onTileClick: (id: string) => void;
}

const Board: React.FC<BoardProps> = ({ tiles, gridSize, interactionMode, selectedTileId, onTileClick }) => {
  // Create background grid cells
  const gridCells = Array.from({ length: gridSize * gridSize });
  
  const isInteractive = interactionMode !== 'none';

  // Responsive gap/padding scale with grid size to fit small screens
  const gapRem = gridSize === 6 ? 0.35 : gridSize === 5 ? 0.5 : 0.75;
  const paddingRem = gridSize === 6 ? 0.6 : gridSize === 5 ? 0.8 : 1;

  return (
    <div
      className={`relative w-full max-w-xl aspect-square bg-slate-800 rounded-xl shadow-2xl mx-auto overflow-hidden ring-4 ring-slate-800/50 ${isInteractive ? 'cursor-crosshair' : ''}`}
      style={{ padding: `${paddingRem}rem` }}
    >
      
      {/* Background Grid Layer */}
      <div
        className="grid w-full h-full"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
          gap: `${gapRem}rem`
        }}
      >
        {gridCells.map((_, i) => (
          <div 
            key={i} 
            className="w-full h-full bg-slate-700/50 rounded-lg"
          ></div>
        ))}
      </div>

      {/* Tiles Layer - Grid on top */}
      <div
        className="absolute inset-0 w-full h-full grid"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
          gap: `${gapRem}rem`,
          padding: `${paddingRem}rem`
        }}
      >
        {tiles.map(tile => (
          <Tile 
            key={tile.id} 
            tile={tile} 
            gridSize={gridSize}
            isInteractive={isInteractive}
            isSelected={selectedTileId === tile.id}
            isTarget={interactionMode === 'eliminate'}
            onClick={onTileClick}
          />
        ))}
      </div>
      
    </div>
  );
};

export default Board;
