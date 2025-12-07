import React from 'react';
import Tile from './Tile';
import { Tile as TileType, InteractionMode } from '../types';
import { GRID_SIZE } from '../constants';

interface BoardProps {
  tiles: TileType[];
  interactionMode: InteractionMode;
  selectedTileId: string | null;
  onTileClick: (id: string) => void;
}

const Board: React.FC<BoardProps> = ({ tiles, interactionMode, selectedTileId, onTileClick }) => {
  // Create background grid cells
  const gridCells = Array.from({ length: GRID_SIZE * GRID_SIZE });
  
  const isInteractive = interactionMode !== 'none';

  return (
    <div className={`relative w-full max-w-xl aspect-square bg-slate-800 rounded-xl p-3 md:p-4 shadow-2xl mx-auto overflow-hidden ring-4 ring-slate-800/50 ${isInteractive ? 'cursor-crosshair' : ''}`}>
      
      {/* Background Grid Layer */}
      <div className="grid grid-cols-4 grid-rows-4 gap-3 md:gap-4 w-full h-full">
        {gridCells.map((_, i) => (
          <div 
            key={i} 
            className="w-full h-full bg-slate-700/50 rounded-lg"
          ></div>
        ))}
      </div>

      {/* Tiles Layer - Absolute positioned on top */}
      <div className="absolute inset-0 p-3 md:p-4 w-full h-full">
        {tiles.map(tile => (
          <Tile 
            key={tile.id} 
            tile={tile} 
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
