import React from 'react';

const Controls = ({ onReset, onUndo, gameState }) => {
  return (
    <div className="chess-controls">
      <button 
        onClick={onReset} 
        className="control-btn reset-btn"
      >
        New Game
      </button>
      <button 
        onClick={onUndo} 
        className="control-btn undo-btn" 
        disabled={!gameState?.history || gameState.history.length <= 1}
      >
        Undo Move
      </button>
      {gameState?.isGameOver && (
        <div className="game-over-message">
          Game Over: 
          {gameState.isCheckmate ? ' Checkmate!' : gameState.isDraw ? ' Draw!' : ' Game ended'}
        </div>
      )}
    </div>
  );
};

export default Controls;