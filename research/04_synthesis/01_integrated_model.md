# Integrated Model: Chess Web Application Implementation

This document presents an integrated model for implementing a multiplayer chess web application using React.js and Supabase, synthesizing our research findings into a cohesive approach.

## System Architecture Overview

The proposed architecture follows a modern web application structure with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Application                      │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │
│  │   React UI  │    │  Game Logic │    │ State Management│  │
│  │             │    │             │    │                 │  │
│  │ Components  │◄──►│  chess.js   │◄──►│  Context API    │  │
│  │ Hooks       │    │  Stockfish  │    │  useReducer     │  │
│  └─────────────┘    └─────────────┘    └─────────────────┘  │
│          ▲                 ▲                    ▲           │
└──────────┼─────────────────┼────────────────────┼───────────┘
           │                 │                    │
           ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Backend                        │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │
│  │    Auth     │    │  Database   │    │    Realtime     │  │
│  │             │    │             │    │                 │  │
│  │ Social Login│    │ PostgreSQL  │    │ Game Updates    │  │
│  │ JWT         │    │ RLS Policies│    │ Move Sync       │  │
│  └─────────────┘    └─────────────┘    └─────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: React.js with functional components and hooks
- **Chess Logic**: chess.js for game rules and validation
- **UI Components**: react-chessboard for chess board rendering
- **Computer Opponent**: Stockfish.js in Web Worker
- **State Management**: React Context API with useReducer
- **Styling**: CSS Modules or Tailwind CSS

### Backend
- **Platform**: Supabase
- **Database**: PostgreSQL
- **Authentication**: Supabase Auth with social providers (Gmail, GitHub)
- **Real-time Communication**: Supabase Realtime
- **Storage**: Supabase Storage (for user avatars, game exports)

## Database Schema

```sql
-- Users profile table
CREATE TABLE public.profiles (
  user_id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  rating INT DEFAULT 1000,
  games_played INT DEFAULT 0,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  draws INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Games table
CREATE TABLE public.games (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  white_player UUID REFERENCES public.profiles(user_id),
  black_player UUID REFERENCES public.profiles(user_id),
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'draw', 'white_win', 'black_win')),
  fen TEXT DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  pgn TEXT DEFAULT '',
  current_turn TEXT DEFAULT 'white',
  time_control JSONB,
  is_rated BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moves table
CREATE TABLE public.moves (
  id BIGSERIAL PRIMARY KEY,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.profiles(user_id),
  move_number INT NOT NULL,
  from_square TEXT NOT NULL,
  to_square TEXT NOT NULL,
  promotion_piece TEXT,
  san TEXT NOT NULL,
  fen_after TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game invitations table
CREATE TABLE public.game_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(user_id),
  recipient_id UUID REFERENCES public.profiles(user_id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);
```

## Security Implementation

### Row-Level Security Policies

```sql
-- Profiles table policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Games table policies
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Games are viewable by participants"
ON public.games FOR SELECT USING (
  auth.uid() = white_player OR 
  auth.uid() = black_player
);

CREATE POLICY "Players can update their active games"
ON public.games FOR UPDATE USING (
  (auth.uid() = white_player AND current_turn = 'white') OR
  (auth.uid() = black_player AND current_turn = 'black')
);

-- Moves table policies
ALTER TABLE public.moves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Moves are viewable by game participants"
ON public.moves FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.games
    WHERE games.id = moves.game_id AND 
    (games.white_player = auth.uid() OR games.black_player = auth.uid())
  )
);

CREATE POLICY "Players can add moves on their turn"
ON public.moves FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.games
    WHERE games.id = moves.game_id AND 
    (
      (games.white_player = auth.uid() AND games.current_turn = 'white') OR
      (games.black_player = auth.uid() AND games.current_turn = 'black')
    )
  )
);
```

## Component Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   ├── SignupForm.jsx
│   │   └── SocialLogin.jsx
│   ├── chess/
│   │   ├── ChessBoard.jsx
│   │   ├── GameControls.jsx
│   │   ├── MoveHistory.jsx
│   │   └── GameStatus.jsx
│   ├── layout/
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   └── Sidebar.jsx
│   └── common/
│       ├── Button.jsx
│       ├── Modal.jsx
│       └── Spinner.jsx
├── contexts/
│   ├── AuthContext.jsx
│   └── GameContext.jsx
├── hooks/
│   ├── useChessGame.js
│   ├── useComputerOpponent.js
│   └── useMultiplayer.js
├── pages/
│   ├── Home.jsx
│   ├── Profile.jsx
│   ├── SinglePlayerGame.jsx
│   ├── MultiplayerGame.jsx
│   └── GameAnalysis.jsx
├── services/
│   ├── supabase.js
│   ├── gameService.js
│   └── authService.js
├── utils/
│   ├── chessUtils.js
│   └── timeUtils.js
├── App.jsx
└── index.jsx
```

## Key Implementation Features

### Authentication Flow

1. **User Registration/Login**
   - Social login with Gmail and GitHub
   - Username selection and profile setup
   - JWT token storage and refresh

2. **Profile Management**
   - User profile editing
   - Rating and statistics display
   - Game history access

### Game Creation and Matchmaking

1. **Single Player Game**
   - Difficulty level selection
   - Time control options
   - Color selection

2. **Multiplayer Game**
   - Random matchmaking based on rating
   - Direct challenge via link or username
   - Custom game settings (time control, rated/casual)

### Game Play Implementation

1. **Chess Board Interaction**
   - Drag and drop piece movement
   - Click-to-select movement alternative
   - Legal move highlighting
   - Last move indication

2. **Game State Management**
   - Real-time updates via Supabase Realtime
   - Move validation on client and server
   - Game status updates (check, checkmate, draw)
   - Time control management

3. **Computer Opponent**
   - Stockfish.js integration in Web Worker
   - Configurable difficulty levels
   - Consistent response times

### Additional Features

1. **Game Analysis**
   - Move review and navigation
   - Optional engine evaluation
   - PGN export/import

2. **Social Features**
   - Friend system
   - Game sharing
   - Optional chat during games

## Implementation Approach

### Phase 1: Core Functionality
- Authentication system with social logins
- Basic profile management
- Single player game against computer
- Core chess logic and UI

### Phase 2: Multiplayer Functionality
- Real-time game state synchronization
- Matchmaking system
- Game invitations
- Time controls

### Phase 3: Advanced Features
- Rating system
- Game analysis tools
- Social features
- Performance optimizations

## Performance Considerations

1. **Optimized Rendering**
   - Memoization of components
   - Efficient state updates
   - Virtualization for long move lists

2. **Network Optimization**
   - Minimal payload sizes
   - Debounced updates
   - Optimistic UI updates

3. **Resource Management**
   - Web Worker for computer engine
   - Lazy loading of non-critical components
   - Efficient database queries with proper indexing

## Security Considerations

1. **Data Protection**
   - Row-Level Security policies
   - Input validation on client and server
   - Protection against common web vulnerabilities

2. **Authentication Security**
   - Secure token handling
   - Session management
   - Rate limiting for authentication attempts

3. **Game Integrity**
   - Server-side move validation
   - Basic anti-cheating measures
   - Secure rating calculations

This integrated model provides a comprehensive approach to implementing a multiplayer chess web application using React.js and Supabase, addressing the key technical, functional, and security requirements identified in our research.