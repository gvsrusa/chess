# Chess Web Application

A modern web-based chess application built using React.js and Supabase. Play against the computer, challenge other players in real-time, and track your progress.

## Features

- Single-player mode with adjustable difficulty using Stockfish.js chess engine
- Multiplayer functionality with real-time game updates
- User authentication with email/password and social login options (Google, GitHub)
- User profiles with gameplay statistics
- Responsive design for desktop and mobile play

## Tech Stack

- **Frontend**: React.js with React Router for navigation
- **Chess Logic**: chess.js for game rules and validation
- **UI Components**: react-chessboard for the chess board interface
- **Computer Opponent**: Stockfish.js for AI functionality
- **Backend/Database**: Supabase for authentication, storage, and real-time functionality

## Project Structure

```
/src
  /components
    /Chess - Chess board and game components
    /Auth - Login and user profile components
    /Multiplayer - Lobby and game room components
    /UI - Layout and navigation components
  /hooks - Custom React hooks
  /services - API and service integrations
  /utils - Helper functions
  /contexts - React context providers
  /styles - Global and component-specific styles
```

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   cd chess-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file in the root directory with your Supabase credentials:
   ```
   REACT_APP_SUPABASE_URL=your-supabase-url
   REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Start the development server:
   ```
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Supabase Setup

1. Create a Supabase account and project at [supabase.com](https://supabase.com)
2. Set up the following tables:
   - games
   - user_profiles
3. Enable Row Level Security (RLS) and configure policies
4. Enable realtime functionality for the games table

## Development Phases

1. **Project Setup and Infrastructure** - Initial React configuration and project structure
2. **Chess Game Core** - Basic chess board and game logic
3. **Single Player Mode** - Integration with Stockfish.js
4. **User Authentication** - Login functionality and user profiles
5. **Multiplayer Functionality** - Real-time game functionality
6. **UI/UX Development** - Responsive design and UX improvements
7. **Testing and QA** - Testing and performance optimization

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App configuration

## License

[MIT](LICENSE)
