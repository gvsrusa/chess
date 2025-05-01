import React from 'react';
import { Chessboard } from 'react-chessboard';

const Board = ({ position, onPieceDrop }) => {
  return (
    <div className="chess-board">
      <Chessboard 
        position={position} 
        onPieceDrop={onPieceDrop}
        boardWidth={400}
      />
    </div>
  );
};

export default Board;