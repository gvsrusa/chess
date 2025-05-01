# Primary Findings: Chess Web Application Implementation

This document contains the primary research findings for implementing a multiplayer chess web application using React.js and Supabase.

## Chess Game Implementation Options

### Chess Libraries Comparison

| Library | Purpose | Features | Pros | Cons |
|---------|---------|----------|------|------|
| chess.js | Game logic | Move validation, PGN support, game state | Industry standard, well-maintained | No UI components |
| chessboard.js | UI representation | Board rendering, piece movement | Widely used, customizable | jQuery dependency |
| react-chessboard | React UI component | React wrapper for chessboard.js | React integration, hooks support | Limited customization |
| Stockfish.js | Chess engine | AI opponent, position evaluation | Strong chess engine, configurable difficulty | Large file size, resource intensive |

### Implementation Approaches

1. **Custom Implementation**
   - Build chess logic from scratch
   - Create custom UI components
   - Full control over all aspects
   - Significant development effort

2. **Library-based Implementation**
   - Use chess.js for game logic
   - Use react-chessboard for UI
   - Integrate Stockfish.js for computer opponent
   - Faster development, proven solutions

3. **Hybrid Approach**
   - Use libraries for core functionality
   - Customize specific components as needed
   - Balance between control and development speed

## Chess Library Implementation Examples

### Basic Chess.js Integration

```javascript
import { Chess } from 'chess.js';

const game = new Chess();
// Validate moves
const makeMove = (move) => {
  try {
    const result = game.move(move);
    if (result) return true;
  } catch (e) {
    return false;
  }
};
```

### React-Chessboard Integration

```javascript
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useState } from 'react';

function ChessGame() {
  const [game, setGame] = useState(new Chess());
  
  function makeAMove(move) {
    const gameCopy = new Chess(game.fen());
    const result = gameCopy.move(move);
    setGame(gameCopy);
    return result;
  }
  
  function onDrop(sourceSquare, targetSquare) {
    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q', // always promote to queen for simplicity
    });
    
    if (move === null) return false; // illegal move
    return true;
  }
  
  return (
    <div>
      <Chessboard
        position={game.fen()}
        onPieceDrop={onDrop}
      />
    </div>
  );
}
```

## Multiplayer Implementation with Supabase

### Database Schema Design

```sql
-- Games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board TEXT NOT NULL, -- FEN string representation
  players UUID[] NOT NULL,
  current_turn VARCHAR(5) NOT NULL DEFAULT 'white',
  status VARCHAR(10) NOT NULL DEFAULT 'waiting',
  winner UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  moves TEXT[] DEFAULT '{}'
);

-- Add RLS policies
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Game access" ON games FOR SELECT USING (auth.uid() = ANY(players));
CREATE POLICY "Game updates" ON games FOR UPDATE USING (auth.uid() = ANY(players));
```

### Real-time Game State Synchronization

Supabase Realtime can be used to implement real-time multiplayer functionality:

1. **Enable Realtime for Games Table**

```sql
-- Enable replication for the games table
ALTER PUBLICATION supabase_realtime ADD TABLE games;
```

2. **Subscribe to Game Changes in React**

```javascript
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

function GameRoom({ gameId }) {
  const [gameState, setGameState] = useState(null);
  
  useEffect(() => {
    // Initial game state fetch
    fetchGameState();
    
    // Subscribe to changes
    const channel = supabase
      .channel('game_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`
        },
        (payload) => {
          setGameState(payload.new);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);
  
  const fetchGameState = async () => {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();
      
    if (data) setGameState(data);
  };
  
  // Handle making a move
  const handleMove = async (move) => {
    const newFen = /* update FEN based on move */;
    const newMoves = [...gameState.moves, move];
    
    const { error } = await supabase
      .from('games')
      .update({
        board: newFen,
        moves: newMoves,
        current_turn: gameState.current_turn === 'white' ? 'black' : 'white'
      })
      .eq('id', gameId);
  };
  
  // Rest of component...
}
```

3. **Handling Game Logic**
   - Validate moves on server and client
   - Maintain consistent game state
   - Handle edge cases (disconnections, timeouts)

## Computer Opponent Implementation

### Stockfish.js Integration

```javascript
// Use stockfish.js in Web Worker for better performance
const engine = new Worker('stockfish.js');

// Set up communication with the engine
engine.onmessage = (e) => {
  const bestMove = parseEngineOutput(e.data);
  if (bestMove) {
    makeMove(bestMove);
  }
};

// Configure engine difficulty (1-20 scale)
const setDifficulty = (level) => {
  // Convert level to appropriate engine settings
  engine.postMessage('setoption name Skill Level value ' + level);
};

// Get the best move from the engine
const getBestMove = (fen, depth = 12) => {
  engine.postMessage('position fen ' + fen);
  engine.postMessage('go depth ' + depth);
};

// Parse engine output to extract the best move
const parseEngineOutput = (output) => {
  if (output.includes('bestmove')) {
    const match = output.match(/bestmove\s+(\S+)/);
    if (match) {
      return match[1]; // e.g., "e2e4"
    }
  }
  return null;
};
```

## Authentication Implementation

Supabase Auth provides built-in support for social logins:

1. **Configure Social Providers in Supabase Dashboard**
   - Set up OAuth credentials for Google and GitHub
   - Configure redirect URLs

2. **Implement Authentication in React**

```javascript
import { useState } from 'react';
import { supabase } from './supabaseClient';

function Auth() {
  const [loading, setLoading] = useState(false);
  
  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) console.error('Error logging in with Google:', error);
    setLoading(false);
  };
  
  const handleGitHubLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
    });
    if (error) console.error('Error logging in with GitHub:', error);
    setLoading(false);
  };
  
  return (
    <div>
      <button onClick={handleGoogleLogin} disabled={loading}>
        Sign in with Google
      </button>
      <button onClick={handleGitHubLogin} disabled={loading}>
        Sign in with GitHub
      </button>
    </div>
  );
}
```

3. **User Session Management**

```javascript
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

function App() {
  const [session, setSession] = useState(null);
  
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);
  
  return (
    <div>
      {!session ? (
        <Auth />
      ) : (
        <Dashboard session={session} />
      )}
    </div>
  );
}
```

## Performance Optimization Strategies

1. **Debounce Move Updates**
   - Prevent race conditions with debounced updates
   - Ensure consistent game state

2. **Conflict Resolution**
   - Use Supabase's row-level locking for concurrent moves
   - Implement optimistic UI updates with fallback

3. **Presence Tracking**
   - Use Supabase's Presence API for online status
   - Handle disconnections gracefully

## Security Considerations

1. **Row-Level Security (RLS) Policies**
   - Restrict access to games based on player participation
   - Prevent unauthorized moves and game state modifications

2. **Move Validation**
   - Validate all moves on both client and server
   - Prevent cheating and illegal moves

## References

1. [Building a Multiplayer Chess Game with React](https://dev.to/superviz/learn-how-to-build-a-multiplayer-chess-game-with-react-2pln)
2. [Chess.js Documentation](https://github.com/jhlywa/chess.js)
3. [React-Chessboard Documentation](https://github.com/Clariity/react-chessboard)
4. [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
5. [Stockfish.js Documentation](https://github.com/nmrugg/stockfish.js)