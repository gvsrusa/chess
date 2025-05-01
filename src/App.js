import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/global.css';
import './styles/components.css';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';

// Components
import Layout from './components/UI/Layout';
import Login from './components/Auth/Login';
import Profile from './components/Auth/Profile';
import Lobby from './components/Multiplayer/Lobby';
import GameRoom from './components/Multiplayer/GameRoom';

// Home page component
const Home = () => (
  <div className="container">
    <h1>Welcome to Chess Web App</h1>
    <p>
      Play chess against the computer or challenge other players online.
      Improve your skills and track your progress!
    </p>
    <div className="card">
      <h2>Getting Started</h2>
      <p>Choose an option to begin:</p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <a href="/play" className="btn">
          <button>Play vs Computer</button>
        </a>
        <a href="/lobby" className="btn">
          <button>Play Online</button>
        </a>
      </div>
    </div>
  </div>
);

// Single Player component using our hooks
const SinglePlayer = () => {
  // This component will be implemented in Phase 3
  return (
    <div className="container">
      <h1>Single Player Mode</h1>
      <p>This feature will be available soon!</p>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <GameProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/play" element={<SinglePlayer />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/lobby" element={<Lobby />} />
              <Route path="/game/:gameId" element={<GameRoom />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Layout>
        </GameProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
