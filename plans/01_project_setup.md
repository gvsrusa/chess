# Phase 1: Project Setup and Infrastructure

## Overview

This phase focuses on establishing the foundational structure and environment for the chess web application. It includes setting up the development environment, initializing the project structure, configuring essential tools, and setting up the Supabase backend.

## Objectives

- Create a well-structured React project
- Configure development tools and dependencies
- Set up version control
- Establish the Supabase project and initial database schema
- Configure development, testing, and production environments

## Tasks

### 1. Development Environment Setup

1. **Install Required Tools**
   - Node.js (v16+) and npm
   - Git for version control
   - VS Code or preferred IDE with extensions:
     - ESLint
     - Prettier
     - React Developer Tools

2. **Configure Development Environment**
   - Set up ESLint with appropriate rules
   - Configure Prettier for code formatting
   - Set up environment variables management

### 2. Project Initialization

1. **Create React Application**
   ```bash
   npx create-react-app chess-app
   cd chess-app
   ```

2. **Install Core Dependencies**
   ```bash
   npm install chess.js react-chessboard
   npm install @supabase/supabase-js
   npm install react-router-dom
   npm install stockfish
   ```

3. **Set Up Project Structure**
   ```
   /src
     /components
       /Chess
         Board.jsx
         Controls.jsx
         GameInfo.jsx
       /Auth
         Login.jsx
         Profile.jsx
       /Multiplayer
         Lobby.jsx
         GameRoom.jsx
       /UI
         Layout.jsx
         Navigation.jsx
     /hooks
       useChessGame.js
       useAuth.js
       useMultiplayer.js
     /services
       supabaseClient.js
       chessEngine.js
     /utils
       helpers.js
     /contexts
       AuthContext.js
       GameContext.js
     /styles
       global.css
       components.css
     App.jsx
     index.jsx
   ```

4. **Initialize Git Repository**
   ```bash
   git init
   ```

5. **Create Initial .gitignore File**
   ```
   # dependencies
   /node_modules
   
   # production
   /build
   
   # environment variables
   .env
   .env.local
   .env.development.local
   .env.test.local
   .env.production.local
   
   # misc
   .DS_Store
   npm-debug.log*
   ```

### 3. Supabase Setup

1. **Create Supabase Project**
   - Sign up/login to Supabase
   - Create a new project
   - Note the API URL and anon key

2. **Configure Environment Variables**
   - Create `.env.local` file:
   ```
   REACT_APP_SUPABASE_URL=your-supabase-url
   REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

3. **Create Supabase Client**
   - Create `src/services/supabaseClient.js`:
   ```javascript
   import { createClient } from '@supabase/supabase-js';

   const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
   const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

   export const supabase = createClient(supabaseUrl, supabaseAnonKey);
   ```

4. **Set Up Initial Database Schema**
   - Create users table (handled by Supabase Auth)
   - Create games table:
   ```sql
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
   ```

   - Create user_profiles table:
   ```sql
   CREATE TABLE user_profiles (
     id UUID PRIMARY KEY REFERENCES auth.users(id),
     username TEXT UNIQUE,
     rating INTEGER DEFAULT 1200,
     games_played INTEGER DEFAULT 0,
     games_won INTEGER DEFAULT 0,
     games_lost INTEGER DEFAULT 0,
     games_drawn INTEGER DEFAULT 0,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

5. **Set Up Row Level Security (RLS)**
   ```sql
   -- Enable RLS on tables
   ALTER TABLE games ENABLE ROW LEVEL SECURITY;
   ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

   -- Create policies for games table
   CREATE POLICY "Game access" ON games FOR SELECT USING (auth.uid() = ANY(players));
   CREATE POLICY "Game updates" ON games FOR UPDATE USING (auth.uid() = ANY(players));
   CREATE POLICY "Game inserts" ON games FOR INSERT WITH CHECK (auth.uid() = ANY(players));

   -- Create policies for user_profiles table
   CREATE POLICY "Profile access" ON user_profiles FOR SELECT USING (true);
   CREATE POLICY "Profile updates" ON user_profiles FOR UPDATE USING (auth.uid() = id);
   CREATE POLICY "Profile inserts" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
   ```

6. **Enable Realtime for Games Table**
   ```sql
   -- Enable replication for the games table
   ALTER PUBLICATION supabase_realtime ADD TABLE games;
   ```

### 4. Initial Application Setup

1. **Create Basic App Component**
   - Set up React Router
   - Create placeholder components
   - Implement basic navigation

2. **Configure Authentication Context**
   - Create auth context provider
   - Implement session management

3. **Set Up Basic Styling**
   - Configure CSS/SCSS structure
   - Implement basic layout components

### 5. Testing Environment Setup

1. **Configure Testing Framework**
   ```bash
   npm install --save-dev jest @testing-library/react @testing-library/jest-dom
   ```

2. **Create Initial Test Files**
   - Set up test configuration
   - Create sample tests for basic components

## Deliverables

- Fully configured development environment
- Initialized React project with proper structure
- Configured Supabase project with initial database schema
- Basic application shell with routing
- Version control setup
- Documentation of environment setup and configuration

## Dependencies

- Access to Supabase account
- Node.js development environment
- Internet connection for package installation

## Timeline

- **Estimated Duration**: 1 week
- **Effort**: 40 person-hours

## Success Criteria

- React application successfully builds and runs locally
- Supabase connection is established and verified
- Database schema is properly configured with RLS
- Git repository is initialized with appropriate .gitignore
- Project structure follows best practices for React applications

## Next Steps

After completing this phase, proceed to [Phase 2: Chess Game Core Implementation](02_chess_game_core.md).