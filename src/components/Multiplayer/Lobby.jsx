import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';

const Lobby = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  
  const navigate = useNavigate();

  // Fetch current user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    
    getUser();
  }, []);

  // Fetch available games
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('games')
          .select('*')
          .eq('status', 'waiting')
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        setGames(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGames();
    
    // Set up real-time subscription
    const gamesSubscription = supabase
      .channel('public:games')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'games' 
        }, 
        fetchGames
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(gamesSubscription);
    };
  }, []);

  const createNewGame = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('games')
        .insert([
          {
            board: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Initial FEN
            players: [user.id],
            status: 'waiting'
          }
        ])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      navigate(`/game/${data.id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const joinGame = async (gameId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      // Get the current game to check players
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('players, status')
        .eq('id', gameId)
        .single();
      
      if (gameError) {
        throw gameError;
      }
      
      if (gameData.status !== 'waiting') {
        throw new Error('This game is no longer available');
      }
      
      if (gameData.players.includes(user.id)) {
        // Already in this game
        navigate(`/game/${gameId}`);
        return;
      }
      
      if (gameData.players.length >= 2) {
        throw new Error('This game is already full');
      }
      
      // Add player to the game
      const newPlayers = [...gameData.players, user.id];
      
      const { error: updateError } = await supabase
        .from('games')
        .update({ 
          players: newPlayers,
          status: newPlayers.length >= 2 ? 'active' : 'waiting'
        })
        .eq('id', gameId);
      
      if (updateError) {
        throw updateError;
      }
      
      navigate(`/game/${gameId}`);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div>Loading games...</div>;
  }

  return (
    <div className="lobby-container">
      <h1>Game Lobby</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="lobby-actions">
        <button 
          onClick={createNewGame}
          className="create-game-button"
        >
          Create New Game
        </button>
      </div>
      
      <div className="available-games">
        <h2>Available Games</h2>
        
        {games.length === 0 ? (
          <p>No games available. Create one to start playing!</p>
        ) : (
          <ul className="games-list">
            {games.map(game => (
              <li key={game.id} className="game-item">
                <div className="game-info">
                  <span>Created: {new Date(game.created_at).toLocaleString()}</span>
                </div>
                <button 
                  onClick={() => joinGame(game.id)}
                  className="join-game-button"
                >
                  Join Game
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Lobby;