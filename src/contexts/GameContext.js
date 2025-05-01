import React, { createContext, useContext, useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import chessEngine from '../services/chessEngine';

// Create context
const GameContext = createContext();

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};

export const GameProvider = ({ children }) => {
  const [chess, setChess] = useState(() => new Chess());
  const [gameState, setGameState] = useState({
    position: 'start',
    turn: 'w',
    isGameOver: false,
    isCheckmate: false,
    isDraw: false,
    inCheck: false,
    history: [],
    moves: []
  });
  const [gameOptions, setGameOptions] = useState({
    playerColor: 'w', // 'w' for white, 'b' for black
    computerOpponent: false,
    computerLevel: 10, // 1-20
    timerEnabled: false,
    timeControl: {
      initial: 600, // 10 minutes in seconds
      increment: 5 // 5 seconds increment
    }
  });
  const [playerTimes, setPlayerTimes] = useState({
    w: 600, // white's time in seconds
    b: 600  // black's time in seconds
  });
  const [aiThinking, setAiThinking] = useState(false);

  // Update game state when chess instance changes
  useEffect(() => {
    updateGameState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chess]);

  // AI move logic
  useEffect(() => {
    const makeAIMove = async () => {
      if (
        gameOptions.computerOpponent &&
        chess.turn() !== gameOptions.playerColor &&
        !gameState.isGameOver &&
        !aiThinking
      ) {
        setAiThinking(true);
        
        try {
          // Configure engine difficulty
          chessEngine.setDifficulty(gameOptions.computerLevel);
          
          // Get AI move
          const bestMove = await chessEngine.getBestMove(chess.fen(), 1000);
          
          if (bestMove && bestMove !== '(none)') {
            const newChess = new Chess(chess.fen());
            newChess.move(bestMove);
            setChess(newChess);
          }
        } catch (error) {
          console.error('Error making AI move:', error);
        } finally {
          setAiThinking(false);
        }
      }
    };

    makeAIMove();
  }, [chess, gameOptions.computerOpponent, gameOptions.playerColor, gameOptions.computerLevel, gameState.isGameOver, aiThinking]);

  const updateGameState = () => {
    setGameState({
      position: chess.fen(),
      turn: chess.turn(),
      isGameOver: chess.isGameOver(),
      isCheckmate: chess.isCheckmate(),
      isDraw: chess.isDraw(),
      isStalemate: chess.isStalemate(),
      isThreefoldRepetition: chess.isThreefoldRepetition(),
      isInsufficientMaterial: chess.isInsufficientMaterial(),
      inCheck: chess.inCheck(),
      history: chess.history({ verbose: true }),
      moves: chess.moves()
    });
  };

  // Make a move
  const makeMove = (move) => {
    try {
      const newChess = new Chess(chess.fen());
      
      // Try to make the move
      const result = typeof move === 'string' 
        ? newChess.move(move) 
        : newChess.move({
            from: move.from,
            to: move.to,
            promotion: 'q' // Always promote to queen for simplicity
          });
      
      if (result) {
        setChess(newChess);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Invalid move:', error);
      return false;
    }
  };

  // Handle dropping a piece on the board
  const onDrop = (sourceSquare, targetSquare) => {
    if (
      gameOptions.computerOpponent && 
      chess.turn() !== gameOptions.playerColor
    ) {
      return false; // Not player's turn
    }
    
    return makeMove({
      from: sourceSquare,
      to: targetSquare
    });
  };

  // Reset the game
  const resetGame = () => {
    const newChess = new Chess();
    setChess(newChess);
    
    // Reset timers if enabled
    if (gameOptions.timerEnabled) {
      setPlayerTimes({
        w: gameOptions.timeControl.initial,
        b: gameOptions.timeControl.initial
      });
    }
  };

  // Undo last move
  const undoMove = () => {
    const newChess = new Chess(chess.fen());
    
    // Undo twice if playing against computer
    if (gameOptions.computerOpponent && chess.history().length >= 2) {
      newChess.undo(); // Undo AI move
      newChess.undo(); // Undo player move
    } else {
      newChess.undo(); // Undo just one move
    }
    
    setChess(newChess);
  };

  // Load position from FEN
  const loadPosition = (fen) => {
    try {
      const newChess = new Chess();
      newChess.load(fen);
      setChess(newChess);
      return true;
    } catch (error) {
      console.error('Invalid FEN string:', error);
      return false;
    }
  };

  // Update game options
  const updateGameOptions = (newOptions) => {
    setGameOptions(prev => ({
      ...prev,
      ...newOptions
    }));
    
    // Reset game if computer level or player color changes
    if (
      (newOptions.computerLevel && newOptions.computerLevel !== gameOptions.computerLevel) || 
      (newOptions.playerColor && newOptions.playerColor !== gameOptions.playerColor)
    ) {
      resetGame();
    }
    
    // Update time control if needed
    if (newOptions.timeControl) {
      setPlayerTimes({
        w: newOptions.timeControl.initial,
        b: newOptions.timeControl.initial
      });
    }
  };

  const value = {
    chess,
    gameState,
    gameOptions,
    playerTimes,
    aiThinking,
    makeMove,
    onDrop,
    resetGame,
    undoMove,
    loadPosition,
    updateGameOptions
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export default GameContext;