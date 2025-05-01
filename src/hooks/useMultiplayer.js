import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { Chess } from 'chess.js';
import useAuth from './useAuth';

const useMultiplayer = (gameId) => {
  const { user } = useAuth();
  const [game, setGame] = useState(null);
  const [chess, setChess] = useState(new Chess());
  const [playerColor, setPlayerColor] = useState(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [opponent, setOpponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch game data
  const fetchGame = useCallback(async () => {
    if (!gameId) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('games')
        .select('*, players:players(*)')
        .eq('id', gameId)
        .single();
        
      if (error) {
        throw error;
      }
      
      setGame(data);
      
      // Initialize chess instance with FEN from DB
      const chessInstance = new Chess();
      chessInstance.load(data.board);
      setChess(chessInstance);
      
      // Determine player's color
      if (user && data.players.includes(user.id)) {
        const playerIndex = data.players.indexOf(user.id);
        setPlayerColor(playerIndex === 0 ? 'w' : 'b');
        
        // Determine opponent
        const opponentId = data.players.find(id => id !== user.id);
        if (opponentId) {
          const { data: opponentData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', opponentId)
            .single();
            
          setOpponent(opponentData);
        }
      }
      
    } catch (err) {
      console.error('Error fetching game:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [gameId, user]);

  // Subscribe to game changes
  useEffect(() => {
    if (!gameId) return;
    
    fetchGame();
    
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
          setGame(payload.new);
          
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
  }, [gameId, fetchGame]);

  // Determine if it's the player's turn
  useEffect(() => {
    if (chess && playerColor) {
      setIsPlayerTurn(chess.turn() === playerColor);
    }
  }, [chess, playerColor]);

  // Make a move
  const makeMove = async (move) => {
    if (!chess || !isPlayerTurn || !game || game.status !== 'active' || !user) {
      return false;
    }
    
    try {
      // Try to make the move
      const result = typeof move === 'string' 
        ? chess.move(move) 
        : chess.move({
            from: move.from,
            to: move.to,
            promotion: 'q' // Always promote to queen for simplicity
          });
      
      if (!result) {
        return false;
      }
      
      // Update game in the database
      const { error } = await supabase
        .from('games')
        .update({
          board: chess.fen(),
          current_turn: chess.turn() === 'w' ? 'white' : 'black',
          moves: [...game.moves, result.san],
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

  // Handle dropping a piece on the board
  const onDrop = (sourceSquare, targetSquare) => {
    return makeMove({
      from: sourceSquare,
      to: targetSquare
    });
  };

  // Create a new game
  const createGame = async () => {
    if (!user) return null;
    
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
      
      return data.id;
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  // Join a game
  const joinGame = async (gameIdToJoin) => {
    if (!user) return false;
    
    try {
      // Get the current game to check players
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('players, status')
        .eq('id', gameIdToJoin)
        .single();
      
      if (gameError) {
        throw gameError;
      }
      
      if (gameData.status !== 'waiting') {
        throw new Error('This game is no longer available');
      }
      
      if (gameData.players.includes(user.id)) {
        // Already in this game
        return true;
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
        .eq('id', gameIdToJoin);
      
      if (updateError) {
        throw updateError;
      }
      
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  return {
    game,
    chess,
    playerColor,
    isPlayerTurn,
    opponent,
    loading,
    error,
    makeMove,
    onDrop,
    createGame,
    joinGame,
    fetchGame
  };
};

export default useMultiplayer;