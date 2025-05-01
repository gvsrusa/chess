# Phase 2: Chess Game Core Implementation

## Overview

This phase focuses on implementing the core chess game functionality, including the chess board UI, game logic, move validation, and basic game state management. This will serve as the foundation for both single-player and multiplayer modes.

## Objectives

- Implement a functional chess board UI
- Integrate chess.js for game rules and logic
- Implement move validation and execution
- Create game state management
- Implement special moves (castling, en passant, promotion)
- Add move history and notation

## Tasks

### 1. Chess Board UI Implementation

1. **Create Chess Board Component**
   - Implement using react-chessboard
   - Configure board appearance and orientation
   - Set up piece rendering

   ```javascript
   // src/components/Chess/Board.jsx
   import { Chessboard } from 'react-chessboard';
   import { useState } from 'react';
   
   function ChessBoard({ position, onPieceDrop }) {
     return (
       <div className="chess-board">
         <Chessboard 
           position={position} 
           onPieceDrop={onPieceDrop}
           boardWidth={500}
           customDarkSquareStyle={{ backgroundColor: '#769656' }}
           customLightSquareStyle={{ backgroundColor: '#eeeed2' }}
         />
       </div>
     );
   }
   
   export default ChessBoard;
   ```

2. **Implement Piece Movement UI**
   - Configure drag-and-drop functionality
   - Add visual feedback for valid/invalid moves
   - Implement move animations

3. **Create Board Controls**
   - Add buttons for game control (reset, undo)
   - Implement board flip functionality
   - Add game status display

### 2. Chess Game Logic Integration

1. **Integrate Chess.js Library**
   - Install and configure chess.js
   - Create game instance management

   ```javascript
   // src/hooks/useChessGame.js
   import { useState, useCallback } from 'react';
   import { Chess } from 'chess.js';
   
   export function useChessGame() {
     const [game, setGame] = useState(new Chess());
     const [gameOver, setGameOver] = useState(false);
     
     // Make a move on the board
     const makeMove = useCallback((move) => {
       try {
         const gameCopy = new Chess(game.fen());
         const result = gameCopy.move(move);
         
         if (result) {
           setGame(gameCopy);
           
           // Check if game is over
           if (gameCopy.isGameOver()) {
             setGameOver(true);
           }
           
           return true;
         }
         return false;
       } catch (e) {
         return false;
       }
     }, [game]);
     
     // Handle piece drop for react-chessboard
     const onDrop = useCallback((sourceSquare, targetSquare) => {
       const move = makeMove({
         from: sourceSquare,
         to: targetSquare,
         promotion: 'q', // always promote to queen for simplicity
       });
       
       return move;
     }, [makeMove]);
     
     // Reset the game
     const resetGame = useCallback(() => {
       const newGame = new Chess();
       setGame(newGame);
       setGameOver(false);
     }, []);
     
     // Undo the last move
     const undoMove = useCallback(() => {
       const gameCopy = new Chess(game.fen());
       gameCopy.undo();
       setGame(gameCopy);
       setGameOver(false);
     }, [game]);
     
     return {
       game,
       gameOver,
       position: game.fen(),
       makeMove,
       onDrop,
       resetGame,
       undoMove,
       turn: game.turn(),
       inCheck: game.inCheck(),
       isCheckmate: game.isCheckmate(),
       isDraw: game.isDraw(),
       isStalemate: game.isStalemate(),
       isThreefoldRepetition: game.isThreefoldRepetition(),
       isInsufficientMaterial: game.isInsufficientMaterial(),
       moves: game.history({ verbose: true }),
     };
   }
   ```

2. **Implement Move Validation**
   - Use chess.js for move validation
   - Handle illegal moves
   - Implement check/checkmate detection

3. **Create Game State Management**
   - Track current board position (FEN notation)
   - Manage turn tracking
   - Handle game status (active, check, checkmate, draw)

### 3. Special Moves Implementation

1. **Implement Castling**
   - Ensure proper castling rules are followed
   - Add visual feedback for castling moves

2. **Implement En Passant**
   - Ensure en passant capture rules are followed
   - Add visual indication for en passant opportunities

3. **Implement Pawn Promotion**
   - Create promotion selection UI
   - Handle promotion logic

   ```javascript
   // src/components/Chess/PromotionDialog.jsx
   import React from 'react';
   
   const pieces = ['q', 'r', 'n', 'b']; // queen, rook, knight, bishop
   
   function PromotionDialog({ onSelect, color }) {
     return (
       <div className="promotion-dialog">
         <h3>Choose Promotion Piece</h3>
         <div className="pieces">
           {pieces.map((piece) => (
             <div 
               key={piece} 
               className="piece" 
               onClick={() => onSelect(piece)}
             >
               <img 
                 src={`/pieces/${color}${piece.toUpperCase()}.svg`} 
                 alt={piece} 
               />
             </div>
           ))}
         </div>
       </div>
     );
   }
   
   export default PromotionDialog;
   ```

### 4. Move History and Notation

1. **Implement Move History Tracking**
   - Record moves in standard chess notation
   - Create move history display component

   ```javascript
   // src/components/Chess/MoveHistory.jsx
   import React from 'react';
   
   function MoveHistory({ moves }) {
     return (
       <div className="move-history">
         <h3>Move History</h3>
         <div className="moves-list">
           {moves.map((move, index) => (
             <div key={index} className="move">
               {index % 2 === 0 && (
                 <span className="move-number">{Math.floor(index / 2) + 1}.</span>
               )}
               <span className="move-notation">{move}</span>
             </div>
           ))}
         </div>
       </div>
     );
   }
   
   export default MoveHistory;
   ```

2. **Add PGN Support**
   - Implement PGN (Portable Game Notation) export
   - Add functionality to import games from PGN

3. **Create Game Status Component**
   - Display current game status (check, checkmate, draw)
   - Show whose turn it is

   ```javascript
   // src/components/Chess/GameStatus.jsx
   import React from 'react';
   
   function GameStatus({ turn, inCheck, isCheckmate, isDraw, isStalemate }) {
     let status = `${turn === 'w' ? 'White' : 'Black'}'s turn`;
     
     if (isCheckmate) {
       status = `Checkmate! ${turn === 'w' ? 'Black' : 'White'} wins`;
     } else if (isDraw) {
       status = 'Game ended in draw';
     } else if (isStalemate) {
       status = 'Stalemate';
     } else if (inCheck) {
       status = `${turn === 'w' ? 'White' : 'Black'} is in check`;
     }
     
     return (
       <div className="game-status">
         <h3>Game Status</h3>
         <p>{status}</p>
       </div>
     );
   }
   
   export default GameStatus;
   ```

### 5. Game Controls Implementation

1. **Create Game Control Panel**
   - Add buttons for game actions (new game, resign, offer draw)
   - Implement undo/redo functionality

   ```javascript
   // src/components/Chess/Controls.jsx
   import React from 'react';
   
   function Controls({ onNewGame, onUndoMove, onResign, onOfferDraw, gameOver }) {
     return (
       <div className="game-controls">
         <button onClick={onNewGame}>New Game</button>
         <button onClick={onUndoMove} disabled={gameOver}>Undo Move</button>
         <button onClick={onResign} disabled={gameOver}>Resign</button>
         <button onClick={onOfferDraw} disabled={gameOver}>Offer Draw</button>
       </div>
     );
   }
   
   export default Controls;
   ```

2. **Implement Game Settings**
   - Add board theme options
   - Implement piece set selection
   - Add board size adjustment

### 6. Main Chess Game Component

1. **Create Main Chess Game Component**
   - Integrate all chess components
   - Implement game flow logic

   ```javascript
   // src/components/Chess/ChessGame.jsx
   import React, { useState } from 'react';
   import ChessBoard from './Board';
   import Controls from './Controls';
   import GameStatus from './GameStatus';
   import MoveHistory from './MoveHistory';
   import PromotionDialog from './PromotionDialog';
   import { useChessGame } from '../../hooks/useChessGame';
   
   function ChessGame() {
     const [showPromotion, setShowPromotion] = useState(false);
     const [promotionMove, setPromotionMove] = useState(null);
     
     const {
       position,
       onDrop,
       resetGame,
       undoMove,
       turn,
       inCheck,
       isCheckmate,
       isDraw,
       isStalemate,
       moves,
     } = useChessGame();
     
     const handlePieceDrop = (sourceSquare, targetSquare) => {
       // Check if this is a pawn promotion move
       const movingPiece = position.split(' ')[0]
         .split('/')
         .join('')
         .match(new RegExp(`[pP](?=[^pP]*${sourceSquare})`));
         
       const isPromotion = 
         (movingPiece && movingPiece[0] === 'P' && targetSquare[1] === '8') || 
         (movingPiece && movingPiece[0] === 'p' && targetSquare[1] === '1');
         
       if (isPromotion) {
         setPromotionMove({ from: sourceSquare, to: targetSquare });
         setShowPromotion(true);
         return false;
       }
       
       return onDrop(sourceSquare, targetSquare);
     };
     
     const handlePromotion = (piece) => {
       onDrop(promotionMove.from, promotionMove.to, piece);
       setShowPromotion(false);
       setPromotionMove(null);
     };
     
     const gameOver = isCheckmate || isDraw || isStalemate;
     
     return (
       <div className="chess-game">
         <div className="game-board">
           <ChessBoard 
             position={position} 
             onPieceDrop={handlePieceDrop} 
           />
           {showPromotion && (
             <PromotionDialog 
               onSelect={handlePromotion} 
               color={turn === 'w' ? 'white' : 'black'} 
             />
           )}
         </div>
         
         <div className="game-info">
           <GameStatus 
             turn={turn} 
             inCheck={inCheck} 
             isCheckmate={isCheckmate} 
             isDraw={isDraw} 
             isStalemate={isStalemate} 
           />
           
           <Controls 
             onNewGame={resetGame} 
             onUndoMove={undoMove} 
             onResign={() => {}} 
             onOfferDraw={() => {}} 
             gameOver={gameOver} 
           />
           
           <MoveHistory moves={moves.map(m => m.san)} />
         </div>
       </div>
     );
   }
   
   export default ChessGame;
   ```

2. **Implement Game Context**
   - Create React context for game state
   - Provide game state to components

## Deliverables

- Fully functional chess board UI
- Implemented chess game logic with all rules
- Working move validation and execution
- Special moves implementation (castling, en passant, promotion)
- Move history and notation display
- Game status tracking and display
- Basic game controls (new game, undo, etc.)

## Dependencies

- Completed Project Setup phase
- React.js environment
- chess.js and react-chessboard libraries

## Timeline

- **Estimated Duration**: 3 weeks
- **Effort**: 120 person-hours

## Success Criteria

- All chess rules are correctly implemented
- Players can make legal moves and illegal moves are prevented
- Special moves work correctly
- Game state (check, checkmate, draw) is properly detected and displayed
- Move history is correctly recorded and displayed
- Game controls function as expected

## Next Steps

After completing this phase, proceed to [Phase 3: Single Player Mode](03_single_player_mode.md) or [Phase 4: User Authentication](04_user_authentication.md) which can be implemented in parallel.