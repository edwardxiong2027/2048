import React, { useEffect, useState, useRef, useCallback } from 'react';
import { RotateCcw, Trophy, BrainCircuit, Wand2, Undo2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X, Trash2, ArrowLeftRight, Sparkles } from 'lucide-react';
import Board from './components/Board';
import { GameState, Direction, AIHintResponse, GameMode, InteractionMode } from './types';
import { initializeGame, moveTiles, checkGameOver, tilesToMatrix, spawnTile, swapTiles, eliminateTile } from './services/gameLogic';
import { getBestMove, getGameCommentary } from './services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

const App: React.FC = () => {
  const [gameMode, setGameMode] = useState<GameMode>('fun');
  const [gameState, setGameState] = useState<GameState>({
    tiles: [],
    score: 0,
    bestScore: 0,
    status: 'playing',
    history: []
  });

  const [aiLoading, setAiLoading] = useState(false);
  const [aiHint, setAiHint] = useState<AIHintResponse | null>(null);
  const [aiComment, setAiComment] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Power-up States
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('none');
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);

  // Load best score
  useEffect(() => {
    const savedBest = localStorage.getItem(`neonSums_bestScore_${gameMode}`);
    if (savedBest) {
      setGameState(prev => ({ ...prev, bestScore: parseInt(savedBest) }));
    }
    startNewGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameMode]);

  const startNewGame = () => {
    const { tiles, score } = initializeGame();
    setGameState(prev => ({
      ...prev,
      tiles,
      score,
      status: 'playing',
      history: [],
    }));
    setAiHint(null);
    setAiComment(null);
    setInteractionMode('none');
    setSelectedTileId(null);
  };

  const saveStateToHistory = useCallback(() => {
    setGameState(prev => {
      const newHistory = [...prev.history, { tiles: prev.tiles, score: prev.score }];
      if (newHistory.length > 10) newHistory.shift();
      return { ...prev, history: newHistory };
    });
  }, []);

  const handleMove = useCallback((direction: Direction) => {
    if (gameState.status !== 'playing' || isProcessing || interactionMode !== 'none') return;
    setIsProcessing(true);

    const currentTiles = gameState.tiles;
    const result = moveTiles(currentTiles, direction);
    
    if (result.moved) {
      if (gameMode === 'fun') saveStateToHistory();
      
      setTimeout(() => {
        const withNewTile = spawnTile(result.tiles);
        const isGameOver = checkGameOver(withNewTile);
        
        setGameState(prev => {
          const newScore = prev.score + result.scoreIncrease;
          const newBest = Math.max(newScore, prev.bestScore);
          localStorage.setItem(`neonSums_bestScore_${gameMode}`, newBest.toString());

          if (isGameOver && gameMode === 'fun') {
             getGameCommentary(newScore, false).then(setAiComment);
          }

          return {
            ...prev,
            tiles: withNewTile,
            score: newScore,
            bestScore: newBest,
            status: isGameOver ? 'lost' : 'playing',
          };
        });
        
        setIsProcessing(false);
        setAiHint(null);
      }, 150);
    } else {
      setIsProcessing(false);
    }
  }, [gameState.status, gameState.tiles, gameState.score, isProcessing, saveStateToHistory, gameMode, interactionMode]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if(gameState.status !== 'playing') return;
      if (interactionMode !== 'none' && e.key === 'Escape') {
        setInteractionMode('none');
        setSelectedTileId(null);
        return;
      }
      
      switch (e.key) {
        case 'ArrowUp': handleMove('UP'); break;
        case 'ArrowDown': handleMove('DOWN'); break;
        case 'ArrowLeft': handleMove('LEFT'); break;
        case 'ArrowRight': handleMove('RIGHT'); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove, gameState.status, interactionMode]);

  const handleUndo = () => {
    if (gameState.history.length === 0) return;
    const previous = gameState.history[gameState.history.length - 1];
    const newHistory = gameState.history.slice(0, -1);
    
    setGameState(prev => ({
      ...prev,
      tiles: previous.tiles,
      score: previous.score,
      status: 'playing',
      history: newHistory
    }));
    setAiHint(null);
  };

  const handleAskAI = async () => {
    if (aiLoading || gameState.status !== 'playing') return;
    setAiLoading(true);
    const matrix = tilesToMatrix(gameState.tiles);
    const hint = await getBestMove(matrix);
    setAiHint(hint);
    setAiLoading(false);
  };

  // --- Power-up Handlers ---

  const handleTileClick = (id: string) => {
    if (interactionMode === 'eliminate') {
      saveStateToHistory();
      const newTiles = eliminateTile(gameState.tiles, id);
      setGameState(prev => ({ ...prev, tiles: newTiles }));
      setInteractionMode('none');
    } else if (interactionMode === 'swap_select_1') {
      setSelectedTileId(id);
      setInteractionMode('swap_select_2');
    } else if (interactionMode === 'swap_select_2') {
      if (selectedTileId && selectedTileId !== id) {
        saveStateToHistory();
        const newTiles = swapTiles(gameState.tiles, selectedTileId, id);
        setGameState(prev => ({ ...prev, tiles: newTiles }));
      }
      setInteractionMode('none');
      setSelectedTileId(null);
    }
  };

  const toggleEliminateMode = () => {
    if (interactionMode === 'eliminate') {
      setInteractionMode('none');
    } else {
      setInteractionMode('eliminate');
      setSelectedTileId(null);
    }
  };

  const toggleSwapMode = () => {
    if (interactionMode.startsWith('swap')) {
      setInteractionMode('none');
      setSelectedTileId(null);
    } else {
      setInteractionMode('swap_select_1');
      setSelectedTileId(null);
    }
  };

  // Touch handling
  const touchStart = useRef<{x: number, y: number} | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    if (interactionMode !== 'none') return; // Disable swipe during interaction
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current || interactionMode !== 'none') return;
    const diffX = e.changedTouches[0].clientX - touchStart.current.x;
    const diffY = e.changedTouches[0].clientY - touchStart.current.y;
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > 30) handleMove(diffX > 0 ? 'RIGHT' : 'LEFT');
    } else {
      if (Math.abs(diffY) > 30) handleMove(diffY > 0 ? 'DOWN' : 'UP');
    }
    touchStart.current = null;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-2 sm:p-4 bg-slate-900 overflow-hidden relative">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-20">
         <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-purple-600 rounded-full blur-[120px]" />
         <div className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="w-full max-w-xl flex flex-col md:flex-row justify-between items-center mb-6 z-10 px-2 sm:px-0 gap-4">
        <div className="text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            2048
          </h1>
          <p className="text-slate-400 text-sm font-medium">Neon Sums Edition</p>
        </div>
        
        {/* Mode Toggle */}
        <div className="bg-slate-800/50 p-1 rounded-xl flex border border-slate-700">
           <button 
             onClick={() => setGameMode('classic')}
             className={clsx(
               "px-4 py-2 rounded-lg text-sm font-bold transition-all",
               gameMode === 'classic' ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-slate-200"
             )}
           >
             Classic
           </button>
           <button 
             onClick={() => setGameMode('fun')}
             className={clsx(
               "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1",
               gameMode === 'fun' ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
             )}
           >
             <Sparkles size={14} />
             Fun
           </button>
        </div>

        <div className="flex gap-3">
          <div className="bg-slate-800 p-2 md:p-3 rounded-lg flex flex-col items-center min-w-[70px] shadow-lg border border-slate-700">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Score</span>
            <span className="text-xl font-bold text-white">{gameState.score}</span>
          </div>
          <div className="bg-slate-800 p-2 md:p-3 rounded-lg flex flex-col items-center min-w-[70px] shadow-lg border border-slate-700">
             <div className="flex items-center gap-1">
               <Trophy size={10} className="text-yellow-400" />
               <span className="text-xs text-slate-400 uppercase tracking-wider">Best</span>
             </div>
            <span className="text-xl font-bold text-white">{gameState.bestScore}</span>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="w-full max-w-xl flex flex-wrap justify-between mb-4 z-10 gap-2 px-2 sm:px-0 min-h-[52px]">
         {gameMode === 'fun' ? (
           <>
             {/* AI Hint */}
             <button 
               onClick={handleAskAI}
               disabled={aiLoading || interactionMode !== 'none'}
               className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-semibold shadow-lg border border-slate-700 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
             >
                {aiLoading ? <Wand2 className="animate-spin" size={18} /> : <BrainCircuit size={18} />}
                <span className="hidden sm:inline">Hint</span>
             </button>

             {/* Swap */}
             <button 
                onClick={toggleSwapMode}
                disabled={gameState.tiles.length < 2}
                className={clsx(
                  "flex-1 text-white py-3 rounded-xl font-semibold shadow-lg border border-slate-700 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50",
                  interactionMode.startsWith('swap') ? "bg-indigo-600 ring-2 ring-indigo-400" : "bg-slate-800 hover:bg-slate-700"
                )}
             >
                <ArrowLeftRight size={18} />
                <span className="hidden sm:inline">Swap</span>
             </button>

             {/* Eliminate */}
             <button 
                onClick={toggleEliminateMode}
                disabled={gameState.tiles.length === 0}
                className={clsx(
                  "flex-1 text-white py-3 rounded-xl font-semibold shadow-lg border border-slate-700 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50",
                  interactionMode === 'eliminate' ? "bg-red-600 ring-2 ring-red-400" : "bg-slate-800 hover:bg-slate-700"
                )}
             >
                <Trash2 size={18} />
                <span className="hidden sm:inline">Remove</span>
             </button>
             
             {/* Undo */}
             <button 
                onClick={handleUndo}
                disabled={gameState.history.length === 0 || interactionMode !== 'none'}
                className="w-14 bg-slate-700 hover:bg-slate-600 text-white rounded-xl flex items-center justify-center shadow-lg transition-all active:scale-95 disabled:opacity-40"
                aria-label="Undo"
             >
                <Undo2 size={20} />
             </button>
           </>
         ) : (
           <div className="flex-1 flex items-center justify-center text-slate-500 text-sm italic bg-slate-800/50 rounded-xl border border-slate-700/50">
             Classic Mode enabled - No AI assistance or power-ups
           </div>
         )}
         
         {/* Reset Game (Always visible) */}
         <button 
            onClick={startNewGame}
            className="w-14 bg-slate-700 hover:bg-slate-600 text-white rounded-xl flex items-center justify-center shadow-lg transition-all active:scale-95"
            aria-label="New Game"
         >
            <RotateCcw size={20} />
         </button>
      </div>
      
      {/* Interaction Prompt Overlay (Toast style) */}
      <AnimatePresence>
        {interactionMode !== 'none' && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="absolute top-24 z-30 bg-slate-900/90 text-white px-6 py-3 rounded-full shadow-2xl border border-indigo-500 flex items-center gap-4"
          >
             <span className="font-bold text-sm">
                {interactionMode === 'eliminate' && "Tap a tile to destroy it"}
                {interactionMode === 'swap_select_1' && "Tap the first tile to swap"}
                {interactionMode === 'swap_select_2' && "Tap the second tile to swap"}
             </span>
             <button onClick={() => { setInteractionMode('none'); setSelectedTileId(null); }} className="p-1 hover:bg-white/20 rounded-full">
               <X size={16} />
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Board Container */}
      <div 
        className="relative z-10 outline-none w-full max-w-xl"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Board 
          tiles={gameState.tiles} 
          interactionMode={interactionMode}
          selectedTileId={selectedTileId}
          onTileClick={handleTileClick}
        />
        
        {/* AI Hint Overlay */}
        <AnimatePresence>
          {aiHint && (
            <motion.div 
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 pointer-events-none flex items-center justify-center z-20"
            >
               <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] rounded-xl" />
               <div className="relative flex flex-col items-center animate-pulse">
                  {aiHint.direction === 'UP' && <ChevronUp size={100} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />}
                  {aiHint.direction === 'DOWN' && <ChevronDown size={100} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />}
                  {aiHint.direction === 'LEFT' && <ChevronLeft size={100} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />}
                  {aiHint.direction === 'RIGHT' && <ChevronRight size={100} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />}
                  <div className="mt-4 bg-slate-900/90 text-yellow-300 px-4 py-2 rounded-lg border border-yellow-500/50 text-center max-w-[250px] shadow-xl">
                    <p className="font-bold text-sm">AI suggests: {aiHint.direction}</p>
                    <p className="text-xs text-slate-300 mt-1">{aiHint.reason}</p>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Over / Won Overlay */}
        <AnimatePresence>
          {gameState.status !== 'playing' && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-xl bg-slate-900/80 backdrop-blur-sm"
             >
                <motion.div 
                  initial={{ scale: 0.5, y: 50 }}
                  animate={{ scale: 1, y: 0 }}
                  className="bg-slate-800 p-6 rounded-2xl border border-slate-600 shadow-2xl text-center max-w-[80%]"
                >
                  <h2 className="text-3xl font-bold mb-2 text-white">
                    {gameState.status === 'won' ? 'You Won!' : 'Game Over'}
                  </h2>
                  <p className="text-slate-300 mb-4">
                    Final Score: <span className="text-white font-bold">{gameState.score}</span>
                  </p>
                  
                  {aiComment && gameMode === 'fun' && (
                    <div className="mb-6 bg-indigo-900/30 p-3 rounded-lg border border-indigo-500/30">
                       <p className="text-xs text-indigo-300 uppercase font-bold mb-1">AI Reaction</p>
                       <p className="text-sm italic text-indigo-100">"{aiComment}"</p>
                    </div>
                  )}

                  <button 
                    onClick={startNewGame}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-pink-500/25 transition-transform hover:scale-105 active:scale-95"
                  >
                    Play Again
                  </button>
                </motion.div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Instructions / Footer */}
      <div className="mt-8 text-center text-slate-500 text-xs md:text-sm max-w-xl">
        <p>Use arrow keys or swipe to merge numbers.</p>
        <p className="mt-1">Reach <span className="text-pink-400 font-bold">2048</span> to win!</p>
      </div>
    </div>
  );
};

export default App;
