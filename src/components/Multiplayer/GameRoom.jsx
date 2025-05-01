import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { supabase } from '../../services/supabaseClient';
import Board from '../Chess/Board';
import Controls from '../Chess/Controls';
import GameInfo from '../Chess/GameInfo';

const GameRoom = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  
  const [game, setGame] = useState(null);
  const [chess, setChess] = useState(new Chess());
  const [user, setUser] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);

  // Fetch current user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    
    getUser();
  }, []);

  // Fetch game data
  useEffect(() => {
    const fetchGameData = async () => {
      if (!gameId) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('games')
          .select('*')
          .eq('id', gameId)
          .single();
          
        if (error) {
          throw error;
        }
        
        if (!data) {
          throw new Error('Game not found');
        }
        
        setGameData(data);
        
        // Initialize chess instance with FEN from DB
        const chessInstance = new Chess();
        chessInstance.load(data.board);
        setChess(chessInstance);
        
        // Determine player's color
        if (user && data.players.includes(user.id)) {
          const playerIndex = data.players.indexOf(user.id);
          setPlayerColor(playerIndex === 0 ? 'w' : 'b');
        }
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGameData();
    
    // Set up real-time subscription
    const gameSubscription = supabase
      .channel(`game:${gameId}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'games',
          filter: `id=eq.${gameId}`
        }, 
        (payload) => {
          setGameData(payload.new);
          
          // Update chess instance
          const chessInstance = new Chess();
          chessInstance.load(payload.new.board);
          setChess(chessInstance);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(gameSubscription);
    };
  }, [gameId, user]);

  // Determine if it's the player's turn
  useEffect(() => {
    if (chess && playerColor) {
      setIsPlayerTurn(chess.turn() === playerColor);
    }
  }, [chess, playerColor]);

  const handleMove = async (source, target) => {
    if (!chess || !isPlayerTurn || !gameData || gameData.status !== 'active') {
      return false;
    }
    
    try {
      // Try to make the move
      const move = chess.move({
        from: source,
        to: target,
        promotion: 'q' // Always promote to queen for simplicity
      });
      
      if (!move) {
        return false;
      }
      
      // Update game in the database
      const { error } = await supabase
        .from('games')
        .update({
          board: chess.fen(),
          current_turn: chess.turn() === 'w' ? 'white' : 'black',
          moves: [...gameData.moves, move.san],
          status: chess.isGameOver() ? 'ended' : 'active',
          winner: chess.isCheckmate() ? user.id : null
        })
        .eq('id', gameId);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const handleReset = async () => {
    try {
      const newChess = new Chess();
      setChess(newChess);
      
      const { error } = await supabase
        .from('games')
        .update({
          board: newChess.fen(),
          current_turn: 'white',
          moves: [],
          status: 'active',
          winner: null
        })
        .eq('id', gameId);
      
      if (error) {
        throw error;
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUndo = async () => {
    if (!chess || !gameData || gameData.moves.length === 0) {
      return;
    }
    
    try {
      chess.undo();
      
      const { error } = await supabase
        .from('games')
        .update({
          board: chess.fen(),
          current_turn: chess.turn() === 'w' ? 'white' : 'black',
          moves: gameData.moves.slice(0, -1),
          status: 'active',
          winner: null
        })
        .eq('id', gameId);
      
      if (error) {
        throw error;
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div>Loading game...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={() => navigate('/lobby')}>Return to Lobby</button>
      </div>
    );
  }

  const gameState = {
    turn: chess.turn(),
    isGameOver: chess.isGameOver(),
    isCheckmate: chess.isCheckmate(),
    isDraw: chess.isDraw(),
    inCheck: chess.inCheck(),
    history: chess.history({ verbose: true })
  };

  return (
    <div className="game-room">
      <h1>Chess Game</h1>
      
      <div className="game-status">
        {gameData.status === 'waiting' && (
          <p>Waiting for another player to join...</p>
        )}
        
        {gameData.status === 'active' && (
          <p className={isPlayerTurn ? 'your-turn' : 'opponent-turn'}>
            {isPlayerTurn ? "Your turn" : "Opponent's turn"}
          </p>
        )}
        
        {gameData.status === 'ended' && (
          <p>Game ended. {gameData.winner === user?.id ? 'You won!' : 'You lost.'}</p>
        )}
      </div>
      
      <div className="game-container">
        <Board 
          position={chess.fen()} 
          onPieceDrop={handleMove}
          orientation={playerColor === 'b' ? 'black' : 'white'}
        />
        
        <div className="game-sidebar">
          <GameInfo gameState={gameState} />
          <Controls 
            onReset={handleReset} 
            onUndo={handleUndo} 
            gameState={gameState} 
          />
        </div>
      </div>
      
      <div className="game-actions">
        <button onClick={() => navigate('/lobby')}>Back to Lobby</button>
      </div>
    </div>
  );
};

export default GameRoom;