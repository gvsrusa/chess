import React from 'react';

const GameInfo = ({ gameState }) => {
  return (
    <div className="game-info">
      <div className="current-turn">
        <h3>Current Turn: {gameState?.turn === 'w' ? 'White' : 'Black'}</h3>
      </div>
      <div className="move-history">
        <h3>Move History</h3>
        <ul>
          {gameState?.history?.map((move, index) => (
            <li key={index}>
              {index % 2 === 0 ? `${Math.floor(index/2) + 1}. ` : ''}
              {move.san}
            </li>
          ))}
        </ul>
      </div>
      {gameState?.inCheck && (
        <div className="check-status">
          <span className="check-message">Check!</span>
        </div>
      )}
    </div>
  );
};

export default GameInfo;