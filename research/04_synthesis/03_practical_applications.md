# Practical Applications: Chess Web Application Implementation

This document outlines practical applications of our research findings, providing concrete steps and code examples for implementing a multiplayer chess web application using React.js and Supabase.

## Project Setup and Configuration

### 1. Initial Project Setup

```bash
# Create React application
npx create-react-app chess-app
cd chess-app

# Install required dependencies
npm install @supabase/supabase-js chess.js react-chessboard stockfish

# Optional UI libraries
npm install tailwindcss @headlessui/react
```

### 2. Supabase Project Configuration

1. Create a new Supabase project from the dashboard
2. Set up authentication providers:
   - Enable Email/Password
   - Configure Google OAuth provider
   - Configure GitHub OAuth provider
3. Set up database tables using the schema from our integrated model
4. Configure Row-Level Security policies

### 3. Environment Configuration

Create a `.env` file for environment variables:

```
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

## Core Implementation Examples

### 1. Supabase Client Setup

```javascript
// src/services/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 2. Authentication Implementation

```javascript
// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
    });
  };

  const signInWithGitHub = async () => {
    return supabase.auth.signInWithOAuth({
      provider: 'github',
    });
  };

  const signOut = async () => {
    return supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithGitHub,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### 3. Chess Game Implementation

```javascript
// src/hooks/useChessGame.js
import { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';

export function useChessGame(initialFen = 'start') {
  const [game, setGame] = useState(new Chess(initialFen));
  const [history, setHistory] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(initialFen);
  
  useEffect(() => {
    // Update history and position when game changes
    setHistory(game.history({ verbose: true }));
    setCurrentPosition(game.fen());
  }, [game]);
  
  const makeMove = useCallback((move) => {
    try {
      const gameCopy = new Chess(game.fen());
      const result = gameCopy.move(move);
      if (result) {
        setGame(gameCopy);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }, [game]);
  
  const resetGame = useCallback(() => {
    setGame(new Chess(initialFen));
  }, [initialFen]);
  
  const undoMove = useCallback(() => {
    const gameCopy = new Chess(game.fen());
    gameCopy.undo();
    setGame(gameCopy);
  }, [game]);
  
  return {
    game,
    history,
    currentPosition,
    makeMove,
    resetGame,
    undoMove,
    isGameOver: game.isGameOver(),
    isCheck: game.isCheck(),
    turn: game.turn(),
    result: getGameResult(game),
  };
}

function getGameResult(game) {
  if (!game.isGameOver()) return null;
  if (game.isCheckmate()) return game.turn() === 'w' ? 'black_win' : 'white_win';
  if (game.isDraw()) return 'draw';
  return null;
}
```

### 4. Chessboard Component

```jsx
// src/components/chess/ChessBoard.jsx
import React, { useState } from 'react';
import { Chessboard } from 'react-chessboard';

export default function ChessBoard({ position, onPieceDrop, playerColor = 'white' }) {
  const [highlightedSquares, setHighlightedSquares] = useState({});
  
  // Optional customization
  const customSquareStyles = {
    ...highlightedSquares,
  };
  
  // Handle piece drag start to highlight legal moves
  const onPieceDragBegin = (piece, sourceSquare) => {
    // Implementation to highlight legal moves
  };
  
  // Handle piece drag end to clear highlights
  const onPieceDragEnd = () => {
    setHighlightedSquares({});
  };
  
  return (
    <div className="chess-board">
      <Chessboard
        position={position}
        onPieceDrop={onPieceDrop}
        onPieceDragBegin={onPieceDragBegin}
        onPieceDragEnd={onPieceDragEnd}
        customSquareStyles={customSquareStyles}
        boardOrientation={playerColor === 'black' ? 'black' : 'white'}
      />
    </div>
  );
}
```

### 5. Multiplayer Game Implementation

```javascript
// src/hooks/useMultiplayerGame.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { useChessGame } from './useChessGame';

export function useMultiplayerGame(gameId) {
  const { user } = useAuth();
  const [gameData, setGameData] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const {
    game,
    currentPosition,
    makeMove,
    isGameOver,
    isCheck,
    turn,
    result,
  } = useChessGame(gameData?.fen || 'start');
  
  // Fetch initial game data
  useEffect(() => {
    async function fetchGame() {
      try {
        const { data, error } = await supabase
          .from('games')
          .select('*')
          .eq('id', gameId)
          .single();
          
        if (error) throw error;
        
        setGameData(data);
        
        // Determine player color
        if (data.white_player === user.id) {
          setPlayerColor('white');
        } else if (data.black_player === user.id) {
          setPlayerColor('black');
        } else {
          // Spectator mode
          setPlayerColor(null);
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }
    
    if (gameId && user) {
      fetchGame();
    }
  }, [gameId, user]);
  
  // Subscribe to game changes
  useEffect(() => {
    if (!gameId) return;
    
    const subscription = supabase
      .channel(`game_${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          setGameData(payload.new);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [gameId]);
  
  // Update isPlayerTurn based on game state
  useEffect(() => {
    if (!gameData || !playerColor) return;
    
    const isTurn = 
      (playerColor === 'white' && gameData.current_turn === 'white') ||
      (playerColor === 'black' && gameData.current_turn === 'black');
      
    setIsPlayerTurn(isTurn);
  }, [gameData, playerColor]);
  
  // Handle making a move in multiplayer
  const handleMove = useCallback(async (move) => {
    if (!isPlayerTurn || !gameData) return false;
    
    // Make local move first
    const moveResult = makeMove(move);
    if (!moveResult) return false;
    
    // Then update the server
    try {
      const { error } = await supabase
        .from('games')
        .update({
          fen: game.fen(),
          pgn: game.pgn(),
          current_turn: game.turn() === 'w' ? 'white' : 'black',
          status: getGameStatus(game),
          updated_at: new Date(),
        })
        .eq('id', gameId);
        
      if (error) throw error;
      
      // Record the move in the moves table
      await supabase
        .from('moves')
        .insert({
          game_id: gameId,
          player_id: user.id,
          move_number: Math.floor(game.moveNumber() / 2) + 1,
          from_square: move.from,
          to_square: move.to,
          promotion_piece: move.promotion,
          san: game.history().slice(-1)[0],
          fen_after: game.fen(),
        });
        
      return true;
    } catch (err) {
      console.error('Error updating game:', err);
      return false;
    }
  }, [game, gameData, gameId, isPlayerTurn, makeMove, user?.id]);
  
  return {
    gameData,
    playerColor,
    isPlayerTurn,
    currentPosition,
    handleMove,
    isGameOver,
    isCheck,
    turn,
    result,
    loading,
    error,
  };
}

function getGameStatus(game) {
  if (!game.isGameOver()) return 'active';
  if (game.isCheckmate()) return game.turn() === 'w' ? 'black_win' : 'white_win';
  if (game.isDraw()) return 'draw';
  return 'active';
}
```

### 6. Computer Opponent Implementation

```javascript
// src/hooks/useComputerOpponent.js
import { useEffect, useRef, useState } from 'react';

export function useComputerOpponent(game, playerColor, difficulty = 5) {
  const [thinking, setThinking] = useState(false);
  const engineRef = useRef(null);
  
  // Initialize Stockfish engine
  useEffect(() => {
    // Create Web Worker for Stockfish
    engineRef.current = new Worker('/stockfish.js');
    
    // Configure engine
    engineRef.current.postMessage('uci');
    engineRef.current.postMessage(`setoption name Skill Level value ${difficulty}`);
    
    // Handle engine responses
    engineRef.current.onmessage = (e) => {
      const message = e.data;
      
      if (message.includes('bestmove')) {
        const match = message.match(/bestmove\s+(\S+)/);
        if (match) {
          const bestMove = match[1];
          handleComputerMove(bestMove);
          setThinking(false);
        }
      }
    };
    
    return () => {
      if (engineRef.current) {
        engineRef.current.terminate();
      }
    };
  }, [difficulty]);
  
  // Get computer move when it's the computer's turn
  useEffect(() => {
    const computerColor = playerColor === 'white' ? 'black' : 'white';
    const isComputerTurn = 
      (computerColor === 'white' && game.turn() === 'w') ||
      (computerColor === 'black' && game.turn() === 'b');
      
    if (isComputerTurn && !game.isGameOver() && !thinking) {
      getComputerMove();
    }
  }, [game, playerColor, thinking]);
  
  // Request move from engine
  const getComputerMove = () => {
    setThinking(true);
    
    // Set position and request move
    engineRef.current.postMessage(`position fen ${game.fen()}`);
    
    // Adjust search depth based on difficulty
    const depth = Math.min(difficulty + 5, 15);
    engineRef.current.postMessage(`go depth ${depth}`);
  };
  
  // Convert engine move format to chess.js format and make the move
  const handleComputerMove = (moveString) => {
    // Convert UCI format (e.g., "e2e4") to chess.js format
    const from = moveString.substring(0, 2);
    const to = moveString.substring(2, 4);
    const promotion = moveString.length > 4 ? moveString[4] : undefined;
    
    game.move({ from, to, promotion });
  };
  
  return {
    thinking,
  };
}
```

## Application Pages Implementation

### 1. Home Page

```jsx
// src/pages/Home.jsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function Home() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="home-page">
      <h1>Chess Application</h1>
      
      {user ? (
        <div className="game-options">
          <h2>Play Chess</h2>
          <div className="options-grid">
            <Link to="/play/computer" className="option-card">
              <h3>Play vs Computer</h3>
              <p>Play against the computer with adjustable difficulty</p>
            </Link>
            
            <Link to="/play/online" className="option-card">
              <h3>Play Online</h3>
              <p>Find an opponent and play online</p>
            </Link>
            
            <Link to="/profile" className="option-card">
              <h3>My Profile</h3>
              <p>View your stats and game history</p>
            </Link>
          </div>
        </div>
      ) : (
        <div className="auth-section">
          <h2>Sign in to play</h2>
          <Link to="/login" className="btn-primary">
            Login / Register
          </Link>
        </div>
      )}
    </div>
  );
}
```

### 2. Single Player Game Page

```jsx
// src/pages/SinglePlayerGame.jsx
import React, { useState } from 'react';
import ChessBoard from '../components/chess/ChessBoard';
import GameControls from '../components/chess/GameControls';
import MoveHistory from '../components/chess/MoveHistory';
import { useChessGame } from '../hooks/useChessGame';
import { useComputerOpponent } from '../hooks/useComputerOpponent';

export default function SinglePlayerGame() {
  const [playerColor, setPlayerColor] = useState('white');
  const [difficulty, setDifficulty] = useState(5);
  
  const {
    game,
    currentPosition,
    makeMove,
    resetGame,
    undoMove,
    history,
    isGameOver,
    isCheck,
    turn,
    result,
  } = useChessGame();
  
  const { thinking } = useComputerOpponent(game, playerColor, difficulty);
  
  const handlePieceDrop = (sourceSquare, targetSquare) => {
    // Check if it's player's turn
    const playerTurn = playerColor === 'white' ? 'w' : 'b';
    if (game.turn() !== playerTurn) return false;
    
    // Try to make the move
    const move = {
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q', // Always promote to queen for simplicity
    };
    
    return makeMove(move);
  };
  
  return (
    <div className="game-container">
      <div className="game-board">
        <ChessBoard
          position={currentPosition}
          onPieceDrop={handlePieceDrop}
          playerColor={playerColor}
        />
      </div>
      
      <div className="game-sidebar">
        <GameControls
          isGameOver={isGameOver}
          result={result}
          onReset={resetGame}
          onUndo={undoMove}
          thinking={thinking}
          isCheck={isCheck}
          turn={turn}
        />
        
        <div className="difficulty-control">
          <label>Difficulty: {difficulty}</label>
          <input
            type="range"
            min="1"
            max="10"
            value={difficulty}
            onChange={(e) => setDifficulty(parseInt(e.target.value))}
          />
        </div>
        
        <MoveHistory history={history} />
      </div>
    </div>
  );
}
```

### 3. Multiplayer Game Page

```jsx
// src/pages/MultiplayerGame.jsx
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ChessBoard from '../components/chess/ChessBoard';
import GameControls from '../components/chess/GameControls';
import MoveHistory from '../components/chess/MoveHistory';
import { useMultiplayerGame } from '../hooks/useMultiplayerGame';

export default function MultiplayerGame() {
  const { gameId } = useParams();
  
  const {
    gameData,
    playerColor,
    isPlayerTurn,
    currentPosition,
    handleMove,
    isGameOver,
    isCheck,
    turn,
    result,
    loading,
    error,
  } = useMultiplayerGame(gameId);
  
  if (loading) {
    return <div>Loading game...</div>;
  }
  
  if (error) {
    return <div>Error: {error}</div>;
  }
  
  const handlePieceDrop = (sourceSquare, targetSquare) => {
    if (!isPlayerTurn) return false;
    
    const move = {
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q', // Always promote to queen for simplicity
    };
    
    return handleMove(move);
  };
  
  return (
    <div className="game-container">
      <div className="game-board">
        <ChessBoard
          position={currentPosition}
          onPieceDrop={handlePieceDrop}
          playerColor={playerColor || 'white'}
        />
      </div>
      
      <div className="game-sidebar">
        <div className="game-info">
          <h2>Game: {gameId}</h2>
          {playerColor ? (
            <p>You are playing as {playerColor}</p>
          ) : (
            <p>You are spectating</p>
          )}
          <p>
            {isPlayerTurn ? "Your turn" : "Opponent's turn"}
          </p>
        </div>
        
        <GameControls
          isGameOver={isGameOver}
          result={result}
          isCheck={isCheck}
          turn={turn}
        />
        
        <MoveHistory history={gameData?.moves || []} />
      </div>
    </div>
  );
}
```

## Deployment and Production Considerations

### 1. Build and Deployment Process

```bash
# Build the React application
npm run build

# Deploy to hosting service (example for Netlify)
netlify deploy --prod
```

### 2. Environment Configuration for Production

Create separate environment files for development and production:

- `.env.development` - Development environment variables
- `.env.production` - Production environment variables

### 3. Performance Monitoring

Implement basic performance monitoring:

```javascript
// src/utils/performance.js
export function trackTiming(label, callback) {
  const start = performance.now();
  const result = callback();
  const duration = performance.now() - start;
  
  console.log(`${label}: ${duration.toFixed(2)}ms`);
  
  // Could send to analytics service
  
  return result;
}
```

These practical applications provide concrete implementation examples for the key components of a multiplayer chess web application using React.js and Supabase, based on our research findings.