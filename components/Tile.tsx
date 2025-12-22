import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Tile as TileType, GridSize } from '../types';
import { TILE_COLORS } from '../constants';

interface TileProps {
  tile: TileType;
  gridSize: GridSize;
  isInteractive?: boolean;
  isSelected?: boolean;
  isTarget?: boolean; // For eliminate or swap target
  onClick?: (id: string) => void;
}

const Tile: React.FC<TileProps> = ({ tile, gridSize, isInteractive, isSelected, isTarget, onClick }) => {
  const { value, r, c, isNew, isMerged } = tile;
  const [scale, setScale] = useState(isNew ? 0 : 1);

  useEffect(() => {
    if (isNew) {
      setScale(1);
    }
  }, [isNew]);

  // Determine color class
  const colorClass = TILE_COLORS[value] || TILE_COLORS['super'];
  // Adjust font size based on digit count so the tile never grows when values get large
  const digitCount = value.toString().length;
  const fontSize = (() => {
    const sizeMap: Record<GridSize, { base: string; mid: string; small: string; tiny: string }> = {
      4: {
        base: 'text-4xl sm:text-5xl md:text-6xl',
        mid: 'text-3xl sm:text-4xl md:text-5xl',
        small: 'text-2xl sm:text-3xl md:text-4xl',
        tiny: 'text-xl sm:text-2xl md:text-3xl'
      },
      5: {
        base: 'text-3xl sm:text-4xl md:text-5xl',
        mid: 'text-2xl sm:text-3xl md:text-4xl',
        small: 'text-xl sm:text-2xl md:text-3xl',
        tiny: 'text-lg sm:text-xl md:text-2xl'
      },
      6: {
        base: 'text-2xl sm:text-3xl md:text-4xl',
        mid: 'text-xl sm:text-2xl md:text-3xl',
        small: 'text-lg sm:text-xl md:text-2xl',
        tiny: 'text-base sm:text-lg md:text-xl'
      }
    };

    const sizes = sizeMap[gridSize];
    if (digitCount <= 2) return sizes.base;
    if (digitCount === 3) return sizes.mid;
    if (digitCount === 4) return sizes.small;
    return sizes.tiny;
  })();

  return (
    <motion.div
      layout
      layoutId={tile.id}
      initial={isNew ? { scale: 0, opacity: 0 } : false}
      animate={{
        scale: isMerged ? [1.05, 1] : isSelected ? 1.02 : 1,
        opacity: 1
      }}
      transition={{
        layout: { type: "spring", stiffness: 260, damping: 30 },
        type: "spring",
        stiffness: 260,
        damping: 30,
        duration: 0.12
      }}
      className={clsx(
        "aspect-square w-full h-full min-w-0 min-h-0 transform-gpu will-change-transform",
        isInteractive ? "cursor-pointer z-20" : "pointer-events-none"
      )}
      style={{ gridRowStart: r + 1, gridColumnStart: c + 1 }}
      onClick={() => isInteractive && onClick?.(tile.id)}
    >
      <div
        className={clsx(
        "w-full h-full min-w-0 min-h-0 rounded-lg flex items-center justify-center font-bold select-none transition-all duration-200 text-slate-50",
        colorClass,
        fontSize,
        isSelected && "ring-4 ring-white ring-offset-2 ring-offset-slate-900 scale-105 shadow-xl",
        isTarget && "ring-4 ring-red-500 ring-offset-2 ring-offset-slate-900 opacity-80",
        isInteractive && !isSelected && "hover:scale-105 hover:brightness-110"
      )}
      >
        <span className="block whitespace-nowrap leading-none tabular-nums">
          {value}
        </span>
      </div>
    </motion.div>
  );
};

export default Tile;
