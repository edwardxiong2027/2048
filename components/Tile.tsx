import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Tile as TileType } from '../types';
import { TILE_COLORS } from '../constants';

interface TileProps {
  tile: TileType;
  isInteractive?: boolean;
  isSelected?: boolean;
  isTarget?: boolean; // For eliminate or swap target
  onClick?: (id: string) => void;
}

const Tile: React.FC<TileProps> = ({ tile, isInteractive, isSelected, isTarget, onClick }) => {
  const { value, r, c, isNew, isMerged } = tile;
  const [scale, setScale] = useState(isNew ? 0 : 1);

  useEffect(() => {
    if (isNew) {
      setScale(1);
    }
  }, [isNew]);

  // Determine color class
  const colorClass = TILE_COLORS[value] || TILE_COLORS['super'];
  // Increased font sizes for larger board
  const fontSize = value > 512 ? 'text-3xl sm:text-4xl md:text-5xl' : 'text-4xl sm:text-5xl md:text-6xl';

  return (
    <motion.div
      layoutId={tile.id} // This helps Framer Motion track identity
      initial={isNew ? { scale: 0, opacity: 0 } : false}
      animate={{ 
        left: `calc(${c * 25}%)`, 
        top: `calc(${r * 25}%)`,
        scale: isMerged ? [1.1, 1] : isSelected ? 1.1 : 1,
        opacity: 1
      }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 30,
        duration: 0.15 
      }}
      className={clsx(
        "absolute w-1/4 h-1/4 p-1.5 md:p-2",
        "transition-none",
        isInteractive ? "cursor-pointer z-20" : "pointer-events-none"
      )}
      onClick={() => isInteractive && onClick?.(tile.id)}
    >
      <div className={clsx(
        "w-full h-full rounded-lg flex items-center justify-center font-bold select-none transition-all duration-200",
        colorClass,
        fontSize,
        isSelected && "ring-4 ring-white ring-offset-2 ring-offset-slate-900 scale-105 shadow-xl",
        isTarget && "ring-4 ring-red-500 ring-offset-2 ring-offset-slate-900 opacity-80",
        isInteractive && !isSelected && "hover:scale-105 hover:brightness-110"
      )}>
        {value}
      </div>
    </motion.div>
  );
};

export default Tile;
