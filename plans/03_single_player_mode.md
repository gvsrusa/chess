# Phase 3: Single Player Mode Implementation

## Overview

This phase focuses on implementing the single-player mode of the chess application, allowing users to play against a computer opponent with adjustable difficulty levels. The implementation will leverage Stockfish.js, a powerful JavaScript chess engine, to provide intelligent computer moves.

## Objectives

- Integrate Stockfish.js chess engine
- Implement adjustable difficulty levels
- Create computer move generation
- Implement game state persistence for single-player games
- Add performance optimizations for the chess engine
- Create a user-friendly interface for single-player mode

## Tasks

### 1. Stockfish.js Integration

1. **Set Up Stockfish.js in Web Worker**
   - Create a Web Worker for Stockfish to run in a separate thread
   - Implement communication between the main thread and the worker

   ```javascript
   // src/services/stockfishWorker.js
   self.importScripts('/stockfish.js');

   self.addEventListener('message', function(e) {
     const stockfish = self.Stockfish();
     stockfish.onmessage = function(msg) {
       self.postMessage(msg);
     };
     stockfish.postMessage(e.data);
   });
   ```

2. **Create Chess Engine Service**
   - Implement a service to manage communication with Stockfish
   - Handle engine initialization and configuration

   ```javascript
   // src/services/chessEngine.js
   export class ChessEngine {
     constructor() {
       this.worker = new Worker('/stockfishWorker.js');
       this.isReady = false;
       this.onMessage = null;
       
       this.worker.onmessage = (e) => {
         const msg = e.data;
         
         if (msg.includes('readyok')) {
           this.isReady = true;
         }
         
         if (this.onMessage) {
           this.onMessage(msg);
         }
       };
       
       // Initialize engine
       this.sendCommand('uci');
       this.sendCommand('isready');
     }
     
     sendCommand(cmd) {
       this.worker.postMessage(cmd);
     }
     
     setSkillLevel(level) {
       // Skill level from 0-20
       this.sendCommand(`setoption name Skill Level value ${level}`);
     }
     
     setSearchDepth(depth) {
       this.searchDepth = depth;
     }
     
     getNextMove(fen, callback) {
       this.onMessage = (msg) => {
         if (msg.includes('bestmove')) {
           const match = msg.match(/bestmove\s+(\S+)/);
           if (match) {
             const bestMove = match[1];
             callback(bestMove);
           }
         }
       };
       
       this.sendCommand(`position fen ${fen}`);
       this.sendCommand(`go depth ${this.searchDepth}`);
     }
     
     terminate() {
       this.worker.terminate();
     }
   }
   ```

### 2. Difficulty Levels Implementation

1. **Define Difficulty Levels**
   - Create a mapping of user-friendly difficulty levels to Stockfish parameters
   - Implement configuration for different skill levels

   ```javascript
   // src/utils/difficultyLevels.js
   export const DIFFICULTY_LEVELS = {
     BEGINNER: {
       name: 'Beginner',
       skillLevel: 2,
       searchDepth: 5,
       description: 'Suitable for new chess players'
     },
     CASUAL: {
       name: 'Casual',
       skillLevel: 5,
       searchDepth: 8,
       description: 'For casual players with some experience'
     },
     INTERMEDIATE: {
       name: 'Intermediate',
       skillLevel: 10,
       searchDepth: 12,
       description: 'Challenging for regular players'
     },
     ADVANCED: {
       name: 'Advanced',
       skillLevel: 15,
       searchDepth: 16,
       description: 'Difficult even for experienced players'
     },
     EXPERT: {
       name: 'Expert',
       skillLevel: 20,
       searchDepth: 20,
       description: 'Very strong, comparable to expert human players'
     }
   };
   ```

2. **Create Difficulty Selection UI**
   - Implement a component for selecting difficulty level
   - Add visual indicators for each level

   ```javascript
   // src/components/Chess/DifficultySelector.jsx
   import React from 'react';
   import { DIFFICULTY_LEVELS } from '../../utils/difficultyLevels';

   function DifficultySelector({ currentLevel, onSelectLevel }) {
     return (
       <div className="difficulty-selector">
         <h3>Select Difficulty</h3>
         <div className="difficulty-options">
           {Object.entries(DIFFICULTY_LEVELS).map(([key, level]) => (
             <div 
               key={key}
               className={`difficulty-option ${currentLevel === key ? 'selected' : ''}`}
               onClick={() => onSelectLevel(key)}
             >
               <h4>{level.name}</h4>
               <p>{level.description}</p>
             </div>
           ))}
         </div>
       </div>
     );
   }

   export default DifficultySelector;
   ```

### 3. Computer Move Generation

1. **Implement Computer Move Logic**
   - Create a hook for managing computer opponent
   - Handle computer move generation and execution

   ```javascript
   // src/hooks/useComputerOpponent.js
   import { useEffect, useRef, useState, useCallback } from 'react';
   import { ChessEngine } from '../services/chessEngine';
   import { DIFFICULTY_LEVELS } from '../utils/difficultyLevels';

   export function useComputerOpponent(game, playerColor = 'w') {
     const [isThinking, setIsThinking] = useState(false);
     const [difficultyKey, setDifficultyKey] = useState('INTERMEDIATE');
     const engineRef = useRef(null);
     
     // Initialize engine
     useEffect(() => {
       engineRef.current = new ChessEngine();
       
       // Set initial difficulty
       const difficulty = DIFFICULTY_LEVELS[difficultyKey];
       engineRef.current.setSkillLevel(difficulty.skillLevel);
       engineRef.current.setSearchDepth(difficulty.searchDepth);
       
       return () => {
         if (engineRef.current) {
           engineRef.current.terminate();
         }
       };
     }, []);
     
     // Update difficulty when it changes
     useEffect(() => {
       if (engineRef.current) {
         const difficulty = DIFFICULTY_LEVELS[difficultyKey];
         engineRef.current.setSkillLevel(difficulty.skillLevel);
         engineRef.current.setSearchDepth(difficulty.searchDepth);
       }
     }, [difficultyKey]);
     
     // Make computer move when it's computer's turn
     useEffect(() => {
       const isComputerTurn = game.turn() !== playerColor;
       
       if (isComputerTurn && !game.isGameOver() && engineRef.current) {
         setIsThinking(true);
         
         // Add a small delay to make it feel more natural
         const timeoutId = setTimeout(() => {
           engineRef.current.getNextMove(game.fen(), (bestMove) => {
             if (bestMove) {
               game.move(bestMove);
               setIsThinking(false);
             }
           });
         }, 500);
         
         return () => clearTimeout(timeoutId);
       }
     }, [game, playerColor]);
     
     const setDifficulty = useCallback((key) => {
       if (DIFFICULTY_LEVELS[key]) {
         setDifficultyKey(key);
       }
     }, []);
     
     return {
       isThinking,
       currentDifficulty: difficultyKey,
       setDifficulty,
       playerColor,
     };
   }
   ```

2. **Integrate with Chess Game Component**
   - Modify the main chess game component to support computer opponent
   - Handle player vs computer interaction

   ```javascript
   // src/components/Chess/SinglePlayerGame.jsx
   import React, { useState } from 'react';
   import ChessBoard from './Board';
   import Controls from './Controls';
   import GameStatus from './GameStatus';
   import MoveHistory from './MoveHistory';
   import DifficultySelector from './DifficultySelector';
   import { useChessGame } from '../../hooks/useChessGame';
   import { useComputerOpponent } from '../../hooks/useComputerOpponent';

   function SinglePlayerGame() {
     const [playerColor, setPlayerColor] = useState('w');
     const {
       game,
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
     
     const {
       isThinking,
       currentDifficulty,
       setDifficulty,
     } = useComputerOpponent(game, playerColor);
     
     const handleNewGame = () => {
       resetGame();
     };
     
     const handleFlipBoard = () => {
       setPlayerColor(playerColor === 'w' ? 'b' : 'w');
     };
     
     const gameOver = isCheckmate || isDraw || isStalemate;
     
     return (
       <div className="single-player-game">
         <div className="game-board">
           <ChessBoard 
             position={position} 
             onPieceDrop={onDrop}
             boardOrientation={playerColor === 'w' ? 'white' : 'black'}
           />
           {isThinking && (
             <div className="thinking-indicator">
               Computer is thinking...
             </div>
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
             onNewGame={handleNewGame} 
             onUndoMove={undoMove} 
             onFlipBoard={handleFlipBoard}
             gameOver={gameOver} 
           />
           
           <DifficultySelector 
             currentLevel={currentDifficulty}
             onSelectLevel={setDifficulty}
           />
           
           <MoveHistory moves={moves.map(m => m.san)} />
         </div>
       </div>
     );
   }

   export default SinglePlayerGame;
   ```

### 4. Game State Persistence

1. **Implement Local Storage for Game State**
   - Save game state to local storage
   - Allow resuming single-player games

   ```javascript
   // src/utils/gameStorage.js
   export const saveGameToLocalStorage = (gameData) => {
     localStorage.setItem('chess_single_player_game', JSON.stringify(gameData));
   };

   export const loadGameFromLocalStorage = () => {
     const savedGame = localStorage.getItem('chess_single_player_game');
     if (savedGame) {
       return JSON.parse(savedGame);
     }
     return null;
   };

   export const clearSavedGame = () => {
     localStorage.removeItem('chess_single_player_game');
   };
   ```

2. **Integrate with Game Hook**
   - Modify the chess game hook to support saving and loading games

   ```javascript
   // Add to src/hooks/useChessGame.js
   import { saveGameToLocalStorage, loadGameFromLocalStorage, clearSavedGame } from '../utils/gameStorage';

   // Inside useChessGame function
   const saveGame = useCallback(() => {
     const gameData = {
       fen: game.fen(),
       moves: game.history({ verbose: true }),
       timestamp: new Date().toISOString(),
     };
     saveGameToLocalStorage(gameData);
   }, [game]);

   const loadGame = useCallback(() => {
     const savedGame = loadGameFromLocalStorage();
     if (savedGame) {
       const loadedGame = new Chess();
       loadedGame.load(savedGame.fen);
       setGame(loadedGame);
       setGameOver(loadedGame.isGameOver());
       return true;
     }
     return false;
   }, []);

   const clearGame = useCallback(() => {
     clearSavedGame();
   }, []);

   // Add these functions to the return object
   return {
     // ... existing properties
     saveGame,
     loadGame,
     clearGame,
   };
   ```

3. **Add UI for Game Management**
   - Create UI components for saving and loading games
   - Implement auto-save functionality

### 5. Performance Optimizations

1. **Implement Thinking Time Adjustments**
   - Add options for controlling computer thinking time
   - Optimize for different devices

2. **Add Progressive Web App Features**
   - Implement service worker for offline play
   - Add caching for assets and game state

3. **Optimize Stockfish Loading**
   - Implement lazy loading for Stockfish.js
   - Add loading indicators during engine initialization

### 6. Single Player Game Modes

1. **Implement Practice Mode**
   - Create a mode for practicing specific positions
   - Add position setup functionality

2. **Add Chess Puzzles**
   - Implement basic chess puzzles
   - Create a puzzle solving interface

3. **Implement Game Analysis**
   - Add post-game analysis with Stockfish
   - Show move evaluation and suggestions

## Deliverables

- Fully functional single-player chess game with computer opponent
- Adjustable difficulty levels
- Game state persistence for saving and resuming games
- Optimized performance for the chess engine
- User-friendly interface for single-player mode
- Basic practice and puzzle modes

## Dependencies

- Completed Chess Game Core phase
- Stockfish.js integration
- Web Worker support in the browser

## Timeline

- **Estimated Duration**: 2 weeks
- **Effort**: 80 person-hours

## Success Criteria

- Computer opponent makes valid and appropriate moves based on difficulty level
- Players can adjust difficulty levels with noticeable differences in play strength
- Game state can be saved and resumed
- The application performs well even on lower-end devices
- The user interface is intuitive and responsive

## Next Steps

After completing this phase, proceed to [Phase 4: User Authentication](04_user_authentication.md) if not already implemented, or to [Phase 5: Multiplayer Functionality](05_multiplayer_functionality.md).