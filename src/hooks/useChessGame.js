import { useState, useEffect } from 'react';
import { Chess } from 'chess.js';

const useChessGame = (initialFen = 'start') => {
  const [chess, setChess] = useState(new Chess(initialFen));
  const [gameState, setGameState] = useState({
    position: chess.fen(),
    turn: chess.turn(),
    isGameOver: chess.isGameOver(),
    isCheckmate: chess.isCheckmate(),
    isDraw: chess.isDraw(),
    inCheck: chess.inCheck(),
    history: chess.history({ verbose: true }),
    moves: chess.moves()
  });

  // Update game state when chess instance changes
  useEffect(() => {
    setGameState({
      position: chess.fen(),
      turn: chess.turn(),
      isGameOver: chess.isGameOver(),
      isCheckmate: chess.isCheckmate(),
      isDraw: chess.isDraw(),
      inCheck: chess.inCheck(),
      history: chess.history({ verbose: true }),
      moves: chess.moves()
    });
  }, [chess]);

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
    return makeMove({
      from: sourceSquare,
      to: targetSquare
    });
  };

  // Reset the game
  const resetGame = () => {
    const newChess = new Chess();
    setChess(newChess);
  };

  // Undo last move
  const undoMove = () => {
    const newChess = new Chess(chess.fen());
    newChess.undo();
    setChess(newChess);
  };

  // Load a position from FEN
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

  return {
    chess,
    gameState,
    makeMove,
    onDrop,
    resetGame,
    undoMove,
    loadPosition
  };
};

export default useChessGame;