# Phase 5: Multiplayer Functionality Implementation

## Overview

This phase focuses on implementing real-time multiplayer functionality for the chess application using Supabase Realtime. It includes game state synchronization, matchmaking, game invitations, and handling player presence and disconnections.

## Objectives

- Implement real-time game state synchronization
- Create a matchmaking system for finding opponents
- Add game invitation functionality
- Implement player presence tracking
- Handle disconnections and reconnections
- Create multiplayer game UI components
- Implement game chat functionality

## Tasks

### 1. Database Schema for Multiplayer

1. **Enhance Games Table**
   - Update the games table schema to support multiplayer functionality
   - Add fields for tracking game status, players, and timing

   ```sql
   -- Enhance games table for multiplayer
   ALTER TABLE games
   ADD COLUMN time_control JSONB DEFAULT '{"type": "rapid", "initial": 600, "increment": 5}',
   ADD COLUMN white_time INTEGER,
   ADD COLUMN black_time INTEGER,
   ADD COLUMN last_move_timestamp TIMESTAMP WITH TIME ZONE,
   ADD COLUMN chat_enabled BOOLEAN DEFAULT true,
   ADD COLUMN is_rated BOOLEAN DEFAULT true;
   ```

2. **Create Game Invitations Table**
   - Implement a table for storing and managing game invitations

   ```sql
   -- Create game invitations table
   CREATE TABLE game_invitations (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     sender_id UUID NOT NULL REFERENCES auth.users(id),
     recipient_id UUID REFERENCES auth.users(id),
     recipient_email TEXT,
     game_id UUID REFERENCES games(id),
     status VARCHAR(10) NOT NULL DEFAULT 'pending',
     time_control JSONB DEFAULT '{"type": "rapid", "initial": 600, "increment": 5}',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
     CONSTRAINT recipient_check CHECK (
       (recipient_id IS NOT NULL AND recipient_email IS NULL) OR
       (recipient_id IS NULL AND recipient_email IS NOT NULL)
     )
   );

   -- Set up RLS policies
   ALTER TABLE game_invitations ENABLE ROW LEVEL SECURITY;

   -- Senders can view their sent invitations
   CREATE POLICY "Senders can view their invitations" ON game_invitations
     FOR SELECT USING (auth.uid() = sender_id);

   -- Recipients can view invitations sent to them
   CREATE POLICY "Recipients can view their invitations" ON game_invitations
     FOR SELECT USING (auth.uid() = recipient_id);

   -- Senders can create invitations
   CREATE POLICY "Users can create invitations" ON game_invitations
3. **Create Matchmaking Queue Table**
   - Implement a table for the matchmaking queue

   ```sql
   -- Create matchmaking queue table
   CREATE TABLE matchmaking_queue (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID NOT NULL REFERENCES auth.users(id),
     rating INTEGER NOT NULL,
     time_control JSONB NOT NULL,
     joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(user_id)
   );

   -- Set up RLS policies
   ALTER TABLE matchmaking_queue ENABLE ROW LEVEL SECURITY;

   -- Users can view the queue
   CREATE POLICY "Users can view the queue" ON matchmaking_queue
     FOR SELECT USING (true);

   -- Users can add themselves to the queue
   CREATE POLICY "Users can add themselves to the queue" ON matchmaking_queue
     FOR INSERT WITH CHECK (auth.uid() = user_id);

   -- Users can remove themselves from the queue
   CREATE POLICY "Users can remove themselves from the queue" ON matchmaking_queue
     FOR DELETE USING (auth.uid() = user_id);
   ```

4. **Enable Realtime for Tables**
   - Configure Supabase Realtime for the relevant tables

   ```sql
   -- Enable replication for multiplayer tables
   ALTER PUBLICATION supabase_realtime ADD TABLE games;
   ALTER PUBLICATION supabase_realtime ADD TABLE game_invitations;
   ALTER PUBLICATION supabase_realtime ADD TABLE matchmaking_queue;
   ```

### 2. Real-time Game State Synchronization

1. **Create Game State Service**
   - Implement a service for managing game state synchronization
   - Handle real-time updates and conflicts

   ```javascript
   // src/services/gameStateService.js
   import { supabase } from './supabaseClient';
   import { Chess } from 'chess.js';

   export class GameStateService {
     constructor(gameId) {
       this.gameId = gameId;
       this.subscription = null;
       this.onGameUpdate = null;
       this.onError = null;
       this.localGame = new Chess();
     }

     async initialize() {
       try {
         // Fetch initial game state
         const { data: game, error } = await supabase
           .from('games')
           .select('*')
           .eq('id', this.gameId)
           .single();

         if (error) throw error;

         // Initialize local game
         if (game.board) {
           this.localGame.load(game.board);
         }

         // Subscribe to game changes
         this.subscription = supabase
           .channel(`game:${this.gameId}`)
           .on(
             'postgres_changes',
             {
               event: 'UPDATE',
               schema: 'public',
               table: 'games',
               filter: `id=eq.${this.gameId}`
             },
             (payload) => {
               this.handleGameUpdate(payload.new);
             }
           )
           .subscribe();

         return game;
       } catch (error) {
         if (this.onError) this.onError(error);
         throw error;
       }
     }

     handleGameUpdate(gameData) {
       try {
         // Update local game state
         if (gameData.board && gameData.board !== this.localGame.fen()) {
           this.localGame.load(gameData.board);
         }

         // Notify listeners
         if (this.onGameUpdate) {
           this.onGameUpdate(gameData, this.localGame);
         }
       } catch (error) {
         if (this.onError) this.onError(error);
       }
     }

     async makeMove(move) {
       try {
         // Validate move locally first
         const result = this.localGame.move(move);
         if (!result) return false;

         // Update game in database
         const { error } = await supabase
           .from('games')
           .update({
             board: this.localGame.fen(),
             current_turn: this.localGame.turn() === 'w' ? 'white' : 'black',
             status: this.getGameStatus(),
             moves: this.localGame.history({ verbose: true }),
             last_move_timestamp: new Date().toISOString()
           })
           .eq('id', this.gameId);

         if (error) throw error;
         return true;
       } catch (error) {
2. **Implement Multiplayer Game Hook**
   - Create a React hook for managing multiplayer game state
   - Handle synchronization with the server

   ```javascript
   // src/hooks/useMultiplayerGame.js
   import { useState, useEffect, useCallback } from 'react';
   import { useAuth } from '../contexts/AuthContext';
   import { GameStateService } from '../services/gameStateService';
   import { supabase } from '../services/supabaseClient';

   export function useMultiplayerGame(gameId) {
     const { user } = useAuth();
     const [game, setGame] = useState(null);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState(null);
     const [gameService, setGameService] = useState(null);
     const [playerColor, setPlayerColor] = useState(null);
     const [isPlayerTurn, setIsPlayerTurn] = useState(false);

     // Initialize game service
     useEffect(() => {
       if (!gameId || !user) return;

       const service = new GameStateService(gameId);
       setGameService(service);

       service.onGameUpdate = (gameData, chessInstance) => {
         setGame({
           ...gameData,
           chessInstance,
           position: chessInstance.fen(),
           inCheck: chessInstance.inCheck(),
           isCheckmate: chessInstance.isCheckmate(),
           isDraw: chessInstance.isDraw(),
           isStalemate: chessInstance.isStalemate(),
           moves: chessInstance.history({ verbose: true })
         });

         // Determine player color
         if (gameData.players && gameData.players.length === 2) {
           const whitePlayer = gameData.players[0];
           const blackPlayer = gameData.players[1];
           
           if (user.id === whitePlayer) {
             setPlayerColor('white');
           } else if (user.id === blackPlayer) {
             setPlayerColor('black');
           }
         }

         // Check if it's player's turn
         const currentTurn = chessInstance.turn() === 'w' ? 'white' : 'black';
         setIsPlayerTurn(currentTurn === playerColor);
       };

       service.onError = (err) => {
         setError(err.message);
       };

       service.initialize()
         .then((initialGame) => {
           setLoading(false);
         })
         .catch((err) => {
           setError(err.message);
           setLoading(false);
         });

       return () => {
         service.cleanup();
       };
     }, [gameId, user]);

     // Make a move
     const makeMove = useCallback((move) => {
       if (!gameService || !isPlayerTurn) return false;
       return gameService.makeMove(move);
     }, [gameService, isPlayerTurn]);

     // Handle piece drop for react-chessboard
     const onDrop = useCallback((sourceSquare, targetSquare) => {
       if (!gameService || !isPlayerTurn) return false;
       
       return makeMove({
         from: sourceSquare,
         to: targetSquare,
         promotion: 'q' // always promote to queen for simplicity
       });
     }, [gameService, isPlayerTurn, makeMove]);

     // Resign game
     const resignGame = useCallback(async () => {
       if (!gameId || !user) return;
       
       try {
         const { error } = await supabase
           .from('games')
           .update({
             status: 'resigned',
             winner: playerColor === 'white' ? game.players[1] : game.players[0]
           })
           .eq('id', gameId);
           
         if (error) throw error;
         return true;
       } catch (err) {
         setError(err.message);
         return false;
       }
     }, [gameId, user, game, playerColor]);

     // Offer draw
     const offerDraw = useCallback(async () => {
       if (!gameId || !user) return;
       
       try {
         const { error } = await supabase
           .from('games')
           .update({
             draw_offered_by: user.id
           })
           .eq('id', gameId);
           
         if (error) throw error;
         return true;
       } catch (err) {
         setError(err.message);
         return false;
       }
     }, [gameId, user]);

     // Accept draw
     const acceptDraw = useCallback(async () => {
       if (!gameId || !user || !game?.draw_offered_by) return;
       
       try {
         const { error } = await supabase
           .from('games')
           .update({
             status: 'draw',
             draw_offered_by: null
           })
           .eq('id', gameId);
           
         if (error) throw error;
         return true;
       } catch (err) {
         setError(err.message);
         return false;
       }
     }, [gameId, user, game]);

     // Decline draw
     const declineDraw = useCallback(async () => {
       if (!gameId || !user || !game?.draw_offered_by) return;
       
       try {
         const { error } = await supabase
           .from('games')
           .update({
             draw_offered_by: null
           })
           .eq('id', gameId);
           
         if (error) throw error;
         return true;
       } catch (err) {
         setError(err.message);
         return false;
       }
     }, [gameId, user, game]);

     return {
       game,
       loading,
       error,
       playerColor,
       isPlayerTurn,
       position: game?.position,
       makeMove,
       onDrop,
       resignGame,
       offerDraw,
       acceptDraw,
       declineDraw,
       drawOffered: game?.draw_offered_by && game.draw_offered_by !== user.id
     };
   }
   ```

### 3. Matchmaking System

1. **Create Matchmaking Service**
   - Implement a service for finding opponents
   - Handle matchmaking queue and game creation

   ```javascript
   // src/services/matchmakingService.js
   import { supabase } from './supabaseClient';

   export class MatchmakingService {
     constructor() {
       this.subscription = null;
       this.onMatchFound = null;
       this.onError = null;
       this.userId = null;
     }

     initialize(userId) {
       this.userId = userId;
       
       // Subscribe to matchmaking queue changes
       this.subscription = supabase
         .channel('matchmaking')
         .on(
           'postgres_changes',
           {
             event: '*',
             schema: 'public',
             table: 'matchmaking_queue'
           },
           (payload) => {
             this.checkForMatch();
           }
         )
         .subscribe();
     }

     async joinQueue(rating, timeControl) {
       try {
         // Remove any existing entries for this user
         await this.leaveQueue();
         
         // Add user to queue
         const { error } = await supabase
           .from('matchmaking_queue')
           .insert({
             user_id: this.userId,
             rating,
             time_control: timeControl
           });
           
         if (error) throw error;
         
         // Check for immediate match
         this.checkForMatch();
         
         return true;
       } catch (error) {
         if (this.onError) this.onError(error);
         return false;
       }
     }

     async leaveQueue() {
       try {
         const { error } = await supabase
           .from('matchmaking_queue')
           .delete()
           .eq('user_id', this.userId);
           
         if (error) throw error;
         return true;
       } catch (error) {
         if (this.onError) this.onError(error);
         return false;
       }
     }

     async checkForMatch() {
       try {
         // Get current user's queue entry
         const { data: userEntry, error: userError } = await supabase
           .from('matchmaking_queue')
           .select('*')
           .eq('user_id', this.userId)
           .single();
           
         if (userError) {
           // User not in queue
           return;
         }
         
         // Find potential opponents
         const { data: opponents, error: opponentsError } = await supabase
           .from('matchmaking_queue')
           .select('*')
           .neq('user_id', this.userId)
           .eq('time_control->>type', userEntry.time_control.type)
           .order('joined_at', { ascending: true });
           
         if (opponentsError) throw opponentsError;
         
         if (opponents && opponents.length > 0) {
           // Find closest rating match
           const sortedOpponents = [...opponents].sort((a, b) => {
             return Math.abs(a.rating - userEntry.rating) - Math.abs(b.rating - userEntry.rating);
           });
           
           const opponent = sortedOpponents[0];
           
           // Create a new game
           const { data: game, error: gameError } = await supabase
             .from('games')
             .insert({
               players: [this.userId, opponent.user_id],
               board: new Chess().fen(),
               current_turn: 'white',
               status: 'active',
               time_control: userEntry.time_control,
               white_time: userEntry.time_control.initial,
               black_time: userEntry.time_control.initial,
               last_move_timestamp: new Date().toISOString(),
               is_rated: true
             })
             .select()
             .single();
             
           if (gameError) throw gameError;
           
           // Remove both players from queue
           await supabase
             .from('matchmaking_queue')
             .delete()
             .in('user_id', [this.userId, opponent.user_id]);
           
           // Notify about the match
           if (this.onMatchFound) {
             this.onMatchFound(game);
           }
         }
       } catch (error) {
         if (this.onError) this.onError(error);
       }
     }

     cleanup() {
       if (this.subscription) {
         supabase.removeChannel(this.subscription);
       }
     }
   }
   ```
         if (this.onError) this.onError(error);
         return false;
2. **Create Matchmaking UI Components**
   - Implement UI for joining the matchmaking queue
   - Add time control selection
   - Create loading and status indicators

   ```javascript
   // src/components/Multiplayer/MatchmakingPanel.jsx
   import React, { useState, useEffect } from 'react';
   import { useNavigate } from 'react-router-dom';
   import { useAuth } from '../../contexts/AuthContext';
   import { useProfile } from '../../hooks/useProfile';
   import { MatchmakingService } from '../../services/matchmakingService';

   const TIME_CONTROLS = [
     { type: 'bullet', initial: 60, increment: 0, label: 'Bullet (1 min)' },
     { type: 'blitz', initial: 180, increment: 2, label: 'Blitz (3+2)' },
     { type: 'rapid', initial: 600, increment: 5, label: 'Rapid (10+5)' },
     { type: 'classical', initial: 1800, increment: 10, label: 'Classical (30+10)' }
   ];

   function MatchmakingPanel() {
     const { user } = useAuth();
     const { profile } = useProfile();
     const navigate = useNavigate();
     const [inQueue, setInQueue] = useState(false);
     const [selectedTimeControl, setSelectedTimeControl] = useState(TIME_CONTROLS[2]); // Default to Rapid
     const [matchmakingService, setMatchmakingService] = useState(null);
     const [queueTime, setQueueTime] = useState(0);
     const [error, setError] = useState(null);

     // Initialize matchmaking service
     useEffect(() => {
       if (!user) return;
       
       const service = new MatchmakingService();
       setMatchmakingService(service);
       
       service.initialize(user.id);
       
       service.onMatchFound = (game) => {
         setInQueue(false);
         navigate(`/play/online/${game.id}`);
       };
       
       service.onError = (err) => {
         setError(err.message);
         setInQueue(false);
       };
       
       return () => {
         service.cleanup();
       };
     }, [user, navigate]);

     // Track queue time
     useEffect(() => {
       let interval;
       
       if (inQueue) {
         setQueueTime(0);
         interval = setInterval(() => {
           setQueueTime(prev => prev + 1);
         }, 1000);
       }
       
       return () => {
         if (interval) clearInterval(interval);
       };
     }, [inQueue]);

     const handleJoinQueue = async () => {
       if (!matchmakingService || !profile) return;
       
       const success = await matchmakingService.joinQueue(
         profile.rating,
         selectedTimeControl
       );
       
       if (success) {
         setInQueue(true);
         setError(null);
       }
     };

     const handleLeaveQueue = async () => {
       if (!matchmakingService) return;
       
       const success = await matchmakingService.leaveQueue();
       
       if (success) {
         setInQueue(false);
       }
     };

     const formatTime = (seconds) => {
       const mins = Math.floor(seconds / 60);
       const secs = seconds % 60;
       return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
     };

     if (!profile) {
       return <div>Loading profile...</div>;
     }

     return (
       <div className="matchmaking-panel">
         <h2>Find a Match</h2>
         
         {error && (
           <div className="error-message">
             {error}
           </div>
         )}
         
         <div className="player-info">
           <h3>Your Rating: {profile.rating}</h3>
           <p>Games Played: {profile.games_played}</p>
         </div>
         
         <div className="time-control-selector">
           <h3>Select Time Control</h3>
           <div className="time-options">
             {TIME_CONTROLS.map((tc) => (
               <div
                 key={tc.type}
                 className={`time-option ${selectedTimeControl.type === tc.type ? 'selected' : ''}`}
                 onClick={() => !inQueue && setSelectedTimeControl(tc)}
               >
                 <h4>{tc.label}</h4>
                 <p>{Math.floor(tc.initial / 60)} min + {tc.increment} sec</p>
               </div>
             ))}
           </div>
         </div>
         
         {inQueue ? (
           <div className="queue-status">
             <div className="spinner"></div>
             <p>Searching for opponent...</p>
             <p>Time in queue: {formatTime(queueTime)}</p>
             <button 
               className="cancel-button"
               onClick={handleLeaveQueue}
             >
               Cancel
             </button>
           </div>
         ) : (
           <button 
             className="find-match-button"
             onClick={handleJoinQueue}
           >
             Find Match
           </button>
         )}
       </div>
     );
   }

   export default MatchmakingPanel;
   ```

### 4. Game Invitations

1. **Create Game Invitation Service**
   - Implement a service for sending and managing invitations
   - Handle invitation acceptance and rejection

   ```javascript
   // src/services/invitationService.js
   import { supabase } from './supabaseClient';

   export class InvitationService {
     constructor() {
       this.subscription = null;
       this.onInvitationReceived = null;
       this.onInvitationUpdated = null;
       this.onError = null;
       this.userId = null;
     }

     initialize(userId) {
       this.userId = userId;
       
       // Subscribe to invitation changes
       this.subscription = supabase
         .channel('invitations')
         .on(
           'postgres_changes',
           {
             event: 'INSERT',
             schema: 'public',
             table: 'game_invitations',
             filter: `recipient_id=eq.${userId}`
           },
           (payload) => {
             if (this.onInvitationReceived) {
               this.onInvitationReceived(payload.new);
             }
           }
         )
         .on(
           'postgres_changes',
           {
             event: 'UPDATE',
             schema: 'public',
             table: 'game_invitations'
           },
           (payload) => {
             if (this.onInvitationUpdated) {
               this.onInvitationUpdated(payload.new);
             }
           }
         )
         .subscribe();
     }

     async sendInvitation(recipientId, timeControl) {
       try {
         // Create a new game
         const { data: game, error: gameError } = await supabase
           .from('games')
           .insert({
             players: [this.userId],
             status: 'waiting',
             time_control: timeControl
           })
           .select()
           .single();
           
         if (gameError) throw gameError;
         
         // Create invitation
         const { data: invitation, error: invitationError } = await supabase
           .from('game_invitations')
           .insert({
             sender_id: this.userId,
             recipient_id: recipientId,
             game_id: game.id,
             time_control: timeControl
           })
           .select()
           .single();
           
         if (invitationError) throw invitationError;
         
         return invitation;
       } catch (error) {
         if (this.onError) this.onError(error);
         throw error;
       }
     }

     async acceptInvitation(invitationId) {
       try {
         // Get invitation details
         const { data: invitation, error: invitationError } = await supabase
           .from('game_invitations')
           .select('*, games(*)')
           .eq('id', invitationId)
           .single();
           
         if (invitationError) throw invitationError;
         
         // Update game with second player
         const { error: gameError } = await supabase
           .from('games')
           .update({
             players: [invitation.sender_id, this.userId],
             status: 'active',
             board: new Chess().fen(),
             current_turn: 'white',
             white_time: invitation.time_control.initial,
             black_time: invitation.time_control.initial,
             last_move_timestamp: new Date().toISOString()
           })
           .eq('id', invitation.game_id);
           
         if (gameError) throw gameError;
         
         // Update invitation status
         const { error: updateError } = await supabase
           .from('game_invitations')
           .update({
             status: 'accepted'
           })
           .eq('id', invitationId);
           
         if (updateError) throw updateError;
         
         return invitation.game_id;
       } catch (error) {
         if (this.onError) this.onError(error);
         throw error;
       }
     }

     async declineInvitation(invitationId) {
       try {
         // Update invitation status
         const { error } = await supabase
           .from('game_invitations')
           .update({
             status: 'declined'
           })
           .eq('id', invitationId);
           
         if (error) throw error;
         
         return true;
       } catch (error) {
         if (this.onError) this.onError(error);
         throw error;
       }
     }

     async getReceivedInvitations() {
       try {
         const { data, error } = await supabase
           .from('game_invitations')
           .select('*, sender:sender_id(id, email), game:game_id(*)')
           .eq('recipient_id', this.userId)
           .eq('status', 'pending');
           
         if (error) throw error;
         
         return data;
       } catch (error) {
         if (this.onError) this.onError(error);
         throw error;
       }
     }

     async getSentInvitations() {
       try {
         const { data, error } = await supabase
           .from('game_invitations')
           .select('*, recipient:recipient_id(id, email), game:game_id(*)')
           .eq('sender_id', this.userId);
           
         if (error) throw error;
         
         return data;
       } catch (error) {
         if (this.onError) this.onError(error);
         throw error;
       }
2. **Create Invitation UI Components**
   - Implement UI for sending and receiving invitations
   - Add notification system for new invitations

   ```javascript
   // src/components/Multiplayer/InvitationPanel.jsx
   import React, { useState, useEffect } from 'react';
   import { useNavigate } from 'react-router-dom';
   import { useAuth } from '../../contexts/AuthContext';
   import { InvitationService } from '../../services/invitationService';

   function InvitationPanel() {
     const { user } = useAuth();
     const navigate = useNavigate();
     const [invitationService, setInvitationService] = useState(null);
     const [receivedInvitations, setReceivedInvitations] = useState([]);
     const [sentInvitations, setSentInvitations] = useState([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState(null);
     const [recipientEmail, setRecipientEmail] = useState('');
     const [selectedTimeControl, setSelectedTimeControl] = useState({
       type: 'rapid',
       initial: 600,
       increment: 5
     });

     // Initialize invitation service
     useEffect(() => {
       if (!user) return;
       
       const service = new InvitationService();
       setInvitationService(service);
       
       service.initialize(user.id);
       
       service.onInvitationReceived = (invitation) => {
         setReceivedInvitations(prev => [...prev, invitation]);
       };
       
       service.onInvitationUpdated = (invitation) => {
         // Update received invitations
         setReceivedInvitations(prev => 
           prev.map(inv => inv.id === invitation.id ? invitation : inv)
         );
         
         // Update sent invitations
         setSentInvitations(prev => 
           prev.map(inv => inv.id === invitation.id ? invitation : inv)
         );
       };
       
       service.onError = (err) => {
         setError(err.message);
       };
       
       // Load initial invitations
       loadInvitations(service);
       
       return () => {
         service.cleanup();
       };
     }, [user]);

     const loadInvitations = async (service) => {
       setLoading(true);
       try {
         const received = await service.getReceivedInvitations();
         const sent = await service.getSentInvitations();
         
         setReceivedInvitations(received || []);
         setSentInvitations(sent || []);
       } catch (err) {
         setError(err.message);
       } finally {
         setLoading(false);
       }
     };

     const handleSendInvitation = async (e) => {
       e.preventDefault();
       if (!invitationService) return;
       
       try {
         // Find user by email
         const { data: users, error: userError } = await supabase
           .from('user_profiles')
           .select('id')
           .eq('email', recipientEmail)
           .limit(1);
           
         if (userError) throw userError;
         
         if (!users || users.length === 0) {
           throw new Error('User not found');
         }
         
         const recipientId = users[0].id;
         
         // Send invitation
         await invitationService.sendInvitation(recipientId, selectedTimeControl);
         
         // Reset form
         setRecipientEmail('');
         
         // Reload invitations
         loadInvitations(invitationService);
       } catch (err) {
         setError(err.message);
       }
     };

     const handleAcceptInvitation = async (invitationId) => {
       if (!invitationService) return;
       
       try {
         const gameId = await invitationService.acceptInvitation(invitationId);
         navigate(`/play/online/${gameId}`);
       } catch (err) {
         setError(err.message);
       }
     };

     const handleDeclineInvitation = async (invitationId) => {
       if (!invitationService) return;
       
       try {
         await invitationService.declineInvitation(invitationId);
         
         // Update local state
         setReceivedInvitations(prev => 
           prev.filter(inv => inv.id !== invitationId)
         );
       } catch (err) {
         setError(err.message);
       }
     };

     if (loading) {
       return <div>Loading invitations...</div>;
     }

     return (
       <div className="invitation-panel">
         <h2>Game Invitations</h2>
         
         {error && (
           <div className="error-message">
             {error}
           </div>
         )}
         
         <div className="send-invitation">
           <h3>Invite a Player</h3>
           <form onSubmit={handleSendInvitation}>
             <div className="form-group">
               <label htmlFor="recipient-email">Player Email</label>
               <input
                 type="email"
                 id="recipient-email"
                 value={recipientEmail}
                 onChange={(e) => setRecipientEmail(e.target.value)}
                 required
               />
             </div>
             
             <div className="form-group">
               <label>Time Control</label>
               <select
                 value={selectedTimeControl.type}
                 onChange={(e) => {
                   const type = e.target.value;
                   if (type === 'bullet') {
                     setSelectedTimeControl({
                       type,
                       initial: 60,
                       increment: 0
                     });
                   } else if (type === 'blitz') {
                     setSelectedTimeControl({
                       type,
                       initial: 180,
                       increment: 2
                     });
                   } else if (type === 'rapid') {
                     setSelectedTimeControl({
                       type,
                       initial: 600,
                       increment: 5
                     });
                   } else if (type === 'classical') {
                     setSelectedTimeControl({
                       type,
                       initial: 1800,
                       increment: 10
                     });
                   }
                 }}
               >
                 <option value="bullet">Bullet (1 min)</option>
                 <option value="blitz">Blitz (3+2)</option>
                 <option value="rapid">Rapid (10+5)</option>
                 <option value="classical">Classical (30+10)</option>
               </select>
             </div>
             
             <button type="submit">Send Invitation</button>
           </form>
         </div>
         
         <div className="received-invitations">
           <h3>Received Invitations</h3>
           {receivedInvitations.length === 0 ? (
             <p>No pending invitations</p>
           ) : (
             <ul className="invitation-list">
               {receivedInvitations.map((invitation) => (
                 <li key={invitation.id} className="invitation-item">
                   <div className="invitation-details">
                     <p>From: {invitation.sender?.email || 'Unknown'}</p>
                     <p>
                       Time Control: {invitation.time_control.type} 
                       ({Math.floor(invitation.time_control.initial / 60)}+{invitation.time_control.increment})
                     </p>
                   </div>
                   <div className="invitation-actions">
                     <button
                       className="accept-button"
                       onClick={() => handleAcceptInvitation(invitation.id)}
                     >
                       Accept
                     </button>
                     <button
                       className="decline-button"
                       onClick={() => handleDeclineInvitation(invitation.id)}
                     >
                       Decline
                     </button>
                   </div>
                 </li>
               ))}
             </ul>
           )}
         </div>
         
         <div className="sent-invitations">
           <h3>Sent Invitations</h3>
           {sentInvitations.length === 0 ? (
             <p>No sent invitations</p>
           ) : (
             <ul className="invitation-list">
               {sentInvitations.map((invitation) => (
                 <li key={invitation.id} className="invitation-item">
                   <div className="invitation-details">
                     <p>To: {invitation.recipient?.email || 'Unknown'}</p>
                     <p>
                       Time Control: {invitation.time_control.type} 
                       ({Math.floor(invitation.time_control.initial / 60)}+{invitation.time_control.increment})
                     </p>
                     <p>Status: {invitation.status}</p>
                   </div>
                 </li>
               ))}
             </ul>
           )}
         </div>
       </div>
     );
   }

   export default InvitationPanel;
   ```

### 5. Multiplayer Game Component

1. **Create Multiplayer Game Component**
   - Implement the main component for multiplayer games
   - Add game status, timer, and player information

   ```javascript
   // src/components/Multiplayer/MultiplayerGame.jsx
   import React, { useState, useEffect } from 'react';
   import { useParams, useNavigate } from 'react-router-dom';
   import { useAuth } from '../../contexts/AuthContext';
   import { useMultiplayerGame } from '../../hooks/useMultiplayerGame';
   import { useProfile } from '../../hooks/useProfile';
   import ChessBoard from '../Chess/Board';
   import GameStatus from '../Chess/GameStatus';
   import MoveHistory from '../Chess/MoveHistory';
   import GameChat from './GameChat';
   import GameTimer from './GameTimer';
   import PlayerInfo from './PlayerInfo';

   function MultiplayerGame() {
     const { gameId } = useParams();
     const { user } = useAuth();
     const { profile } = useProfile();
     const navigate = useNavigate();
     const [showDrawOffer, setShowDrawOffer] = useState(false);
     
     const {
       game,
       loading,
       error,
       playerColor,
       isPlayerTurn,
       position,
       onDrop,
       resignGame,
       offerDraw,
       acceptDraw,
       declineDraw,
       drawOffered
     } = useMultiplayerGame(gameId);

     // Show draw offer dialog when draw is offered
     useEffect(() => {
       if (drawOffered) {
         setShowDrawOffer(true);
       } else {
         setShowDrawOffer(false);
       }
     }, [drawOffered]);

     // Handle game completion
     useEffect(() => {
       if (game?.status === 'checkmate' || game?.status === 'draw' || 
           game?.status === 'stalemate' || game?.status === 'resigned') {
         // Update user stats
         // This would be handled by a backend function in a real implementation
       }
     }, [game?.status]);

     const handleResignGame = async () => {
       if (window.confirm('Are you sure you want to resign?')) {
         await resignGame();
       }
     };

     const handleOfferDraw = async () => {
       await offerDraw();
     };

     const handleAcceptDraw = async () => {
       await acceptDraw();
       setShowDrawOffer(false);
     };

     const handleDeclineDraw = async () => {
       await declineDraw();
       setShowDrawOffer(false);
     };

     if (loading) {
       return <div>Loading game...</div>;
     }

     if (error) {
       return <div>Error: {error}</div>;
     }

     if (!game) {
       return <div>Game not found</div>;
     }

     const opponent = game.players.find(id => id !== user.id);
     const isGameOver = game.status === 'checkmate' || game.status === 'draw' || 
                        game.status === 'stalemate' || game.status === 'resigned';

     return (
       <div className="multiplayer-game">
         <div className="game-container">
           <div className="game-info-panel">
             <PlayerInfo 
               playerId={playerColor === 'white' ? game.players[1] : game.players[0]} 
               isActive={!isPlayerTurn && !isGameOver}
             />
             
             <GameTimer 
               gameId={gameId}
               whiteTime={game.white_time}
               blackTime={game.black_time}
               timeControl={game.time_control}
               currentTurn={game.current_turn}
               gameStatus={game.status}
             />
             
             <div className="game-controls">
               <button 
                 onClick={handleResignGame}
                 disabled={isGameOver}
               >
                 Resign
               </button>
               <button 
                 onClick={handleOfferDraw}
                 disabled={isGameOver || drawOffered}
               >
                 Offer Draw
               </button>
             </div>
2. **Implement Game Timer Component**
   - Create a component for tracking and displaying game time
   - Handle time updates and expiration

   ```javascript
   // src/components/Multiplayer/GameTimer.jsx
   import React, { useState, useEffect } from 'react';
   import { supabase } from '../../services/supabaseClient';

   function GameTimer({ gameId, whiteTime, blackTime, timeControl, currentTurn, gameStatus }) {
     const [times, setTimes] = useState({
       white: whiteTime,
       black: blackTime
     });
     const [subscription, setSubscription] = useState(null);
     const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
     const [timerInterval, setTimerInterval] = useState(null);

     // Subscribe to game updates
     useEffect(() => {
       const channel = supabase
         .channel(`game_timer:${gameId}`)
         .on(
           'postgres_changes',
           {
             event: 'UPDATE',
             schema: 'public',
             table: 'games',
             filter: `id=eq.${gameId}`
           },
           (payload) => {
             setTimes({
               white: payload.new.white_time,
               black: payload.new.black_time
             });
             setLastUpdateTime(Date.now());
           }
         )
         .subscribe();

       setSubscription(channel);

       return () => {
         if (channel) {
           supabase.removeChannel(channel);
         }
       };
     }, [gameId]);

     // Handle timer updates
     useEffect(() => {
       if (gameStatus !== 'active') {
         // Clear interval if game is not active
         if (timerInterval) {
           clearInterval(timerInterval);
           setTimerInterval(null);
         }
         return;
       }

       // Clear existing interval
       if (timerInterval) {
         clearInterval(timerInterval);
       }

       // Start new interval
       const interval = setInterval(() => {
         const now = Date.now();
         const elapsed = Math.floor((now - lastUpdateTime) / 1000);

         setTimes(prevTimes => {
           const newTimes = { ...prevTimes };
           
           if (currentTurn === 'white') {
             newTimes.white = Math.max(0, prevTimes.white - elapsed);
           } else {
             newTimes.black = Math.max(0, prevTimes.black - elapsed);
           }
           
           return newTimes;
         });

         setLastUpdateTime(now);

         // Check for time expiration
         if ((currentTurn === 'white' && times.white <= 0) || 
             (currentTurn === 'black' && times.black <= 0)) {
           // Time expired, update game status
           updateGameOnTimeExpiration();
           clearInterval(interval);
         }
       }, 1000);

       setTimerInterval(interval);

       return () => {
         clearInterval(interval);
       };
     }, [gameId, currentTurn, gameStatus, lastUpdateTime]);

     const updateGameOnTimeExpiration = async () => {
       try {
         await supabase
           .from('games')
           .update({
             status: 'timeout',
             winner: currentTurn === 'white' ? 'black' : 'white'
           })
           .eq('id', gameId);
       } catch (error) {
         console.error('Error updating game on time expiration:', error);
       }
     };

     const formatTime = (seconds) => {
       const mins = Math.floor(seconds / 60);
       const secs = seconds % 60;
       return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
     };

     return (
       <div className="game-timer">
         <div className={`timer white ${currentTurn === 'white' ? 'active' : ''}`}>
           <span className="label">White</span>
           <span className="time">{formatTime(times.white)}</span>
         </div>
         <div className={`timer black ${currentTurn === 'black' ? 'active' : ''}`}>
           <span className="label">Black</span>
           <span className="time">{formatTime(times.black)}</span>
         </div>
       </div>
     );
   }

   export default GameTimer;
   ```

### 6. Game Chat Functionality

1. **Create Chat Service**
   - Implement a service for handling game chat messages
   - Set up real-time message synchronization

   ```javascript
   // src/services/chatService.js
   import { supabase } from './supabaseClient';

   export class ChatService {
     constructor(gameId) {
       this.gameId = gameId;
       this.subscription = null;
       this.onMessageReceived = null;
       this.onError = null;
     }

     initialize() {
       // Subscribe to chat messages
       this.subscription = supabase
         .channel(`game_chat:${this.gameId}`)
         .on(
           'postgres_changes',
           {
             event: 'INSERT',
             schema: 'public',
             table: 'chat_messages',
             filter: `game_id=eq.${this.gameId}`
           },
           (payload) => {
             if (this.onMessageReceived) {
               this.onMessageReceived(payload.new);
             }
           }
         )
         .subscribe();
     }

     async sendMessage(userId, content) {
       try {
         const { error } = await supabase
           .from('chat_messages')
           .insert({
             game_id: this.gameId,
             user_id: userId,
             content,
             created_at: new Date().toISOString()
           });
           
         if (error) throw error;
         
         return true;
       } catch (error) {
         if (this.onError) this.onError(error);
         return false;
       }
     }

     async getMessages() {
       try {
         const { data, error } = await supabase
           .from('chat_messages')
           .select('*, user:user_id(id, username, avatar_url)')
           .eq('game_id', this.gameId)
           .order('created_at', { ascending: true });
           
         if (error) throw error;
         
         return data;
       } catch (error) {
         if (this.onError) this.onError(error);
         return [];
       }
     }

     cleanup() {
       if (this.subscription) {
         supabase.removeChannel(this.subscription);
       }
     }
   }
   ```

2. **Create Chat Component**
   - Implement UI for chat functionality
   - Add message display and input

   ```javascript
   // src/components/Multiplayer/GameChat.jsx
   import React, { useState, useEffect, useRef } from 'react';
   import { useAuth } from '../../contexts/AuthContext';
   import { ChatService } from '../../services/chatService';

   function GameChat({ gameId }) {
     const { user } = useAuth();
     const [messages, setMessages] = useState([]);
     const [newMessage, setNewMessage] = useState('');
     const [chatService, setChatService] = useState(null);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState(null);
     const messagesEndRef = useRef(null);

     // Initialize chat service
     useEffect(() => {
       if (!gameId || !user) return;
       
       const service = new ChatService(gameId);
       setChatService(service);
       
       service.onMessageReceived = (message) => {
         setMessages(prev => [...prev, message]);
       };
       
       service.onError = (err) => {
         setError(err.message);
       };
       
       service.initialize();
       
       // Load initial messages
       loadMessages(service);
       
       return () => {
         service.cleanup();
       };
     }, [gameId, user]);

     // Scroll to bottom when messages change
     useEffect(() => {
       messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
     }, [messages]);

     const loadMessages = async (service) => {
       setLoading(true);
       try {
         const data = await service.getMessages();
         setMessages(data || []);
       } catch (err) {
         setError(err.message);
       } finally {
         setLoading(false);
       }
     };

     const handleSendMessage = async (e) => {
       e.preventDefault();
       if (!chatService || !newMessage.trim()) return;
       
       const success = await chatService.sendMessage(user.id, newMessage.trim());
       
       if (success) {
         setNewMessage('');
       }
     };

     return (
       <div className="game-chat">
         <h3>Game Chat</h3>
         
         {error && (
           <div className="error-message">
             {error}
           </div>
         )}
         
         <div className="messages-container">
           {loading ? (
             <div className="loading">Loading messages...</div>
           ) : messages.length === 0 ? (
             <div className="no-messages">No messages yet</div>
           ) : (
             <div className="messages">
               {messages.map((message) => (
                 <div 
                   key={message.id} 
                   className={`message ${message.user_id === user.id ? 'own' : 'other'}`}
                 >
                   <div className="message-header">
                     <span className="username">
                       {message.user?.username || 'Unknown'}
                     </span>
                     <span className="time">
                       {new Date(message.created_at).toLocaleTimeString()}
                     </span>
                   </div>
                   <div className="message-content">
                     {message.content}
                   </div>
                 </div>
               ))}
               <div ref={messagesEndRef} />
             </div>
           )}
         </div>
         
         <form className="message-form" onSubmit={handleSendMessage}>
           <input
             type="text"
             value={newMessage}
             onChange={(e) => setNewMessage(e.target.value)}
             placeholder="Type a message..."
             disabled={loading}
           />
           <button type="submit" disabled={loading || !newMessage.trim()}>
             Send
           </button>
         </form>
       </div>
     );
   }

   export default GameChat;
   ```

### 7. Player Presence Tracking

1. **Implement Presence Service**
   - Create a service for tracking player presence
   - Handle online status and disconnections

   ```javascript
   // src/services/presenceService.js
   import { supabase } from './supabaseClient';

   export class PresenceService {
     constructor() {
       this.channel = null;
       this.userId = null;
       this.gameId = null;
       this.onPresenceChange = null;
     }

     initialize(userId, gameId) {
       this.userId = userId;
       this.gameId = gameId;
       
       // Create presence channel
       this.channel = supabase.channel(`presence:${gameId}`, {
         config: {
           presence: {
             key: userId,
           },
         },
       });

       // Handle presence changes
       this.channel.on('presence', { event: 'sync' }, () => {
         const state = this.channel.presenceState();
         
         if (this.onPresenceChange) {
           this.onPresenceChange(state);
         }
       });

       // Handle presence joins
       this.channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
         console.log(`User ${key} joined`);
       });

       // Handle presence leaves
       this.channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
         console.log(`User ${key} left`);
       });

       // Subscribe to the channel
       this.channel.subscribe(async (status) => {
         if (status === 'SUBSCRIBED') {
           await this.channel.track({
             online_at: new Date().toISOString(),
           });
         }
       });
     }

     cleanup() {
       if (this.channel) {
         this.channel.unsubscribe();
       }
     }
   }
   ```

2. **Integrate Presence with Game Component**
   - Add presence indicators to the game UI
   - Handle disconnection notifications

## Deliverables

- Fully functional multiplayer chess game with real-time updates
- Matchmaking system for finding opponents
- Game invitation functionality
- Real-time game state synchronization
- Game chat functionality
- Player presence tracking
- Game timer implementation
- Disconnection handling

## Dependencies

- Completed Chess Game Core phase
- Completed User Authentication phase
- Supabase Realtime functionality
- React.js environment

## Timeline

- **Estimated Duration**: 3 weeks
- **Effort**: 120 person-hours

## Success Criteria

- Players can find opponents through matchmaking
- Players can send and accept game invitations
- Game state is properly synchronized in real-time
- Players can communicate through game chat
- Game timers function correctly
- Player presence is accurately tracked
- Disconnections are handled gracefully
- The multiplayer experience is smooth and responsive

## Next Steps

After completing this phase, proceed to [Phase 6: UI/UX Development](06_ui_ux_development.md) which can be implemented in parallel with this phase.
             
             <GameStatus 
               turn={game.current_turn} 
               inCheck={game.chessInstance?.inCheck()} 
               isCheckmate={game.status === 'checkmate'} 
               isDraw={game.status === 'draw'} 
               isStalemate={game.status === 'stalemate'} 
               isResigned={game.status === 'resigned'}
             />
             
             <MoveHistory moves={game.moves?.map(m => m.san) || []} />
             
             <PlayerInfo 
               playerId={playerColor === 'white' ? game.players[0] : game.players[1]} 
               isActive={isPlayerTurn && !isGameOver}
               isCurrentUser={true}
             />
           </div>
           
           <div className="game-board-container">
             <ChessBoard 
               position={position} 
               onPieceDrop={onDrop}
               boardOrientation={playerColor === 'white' ? 'white' : 'black'}
               isDraggable={isPlayerTurn && !isGameOver}
             />
             
             {showDrawOffer && (
               <div className="draw-offer-dialog">
                 <p>Your opponent has offered a draw</p>
                 <div className="draw-actions">
                   <button onClick={handleAcceptDraw}>Accept</button>
                   <button onClick={handleDeclineDraw}>Decline</button>
                 </div>
               </div>
             )}
             
             {isGameOver && (
               <div className="game-result-overlay">
                 <h2>Game Over</h2>
                 <p>
                   {game.status === 'checkmate' && (
                     `Checkmate! ${game.current_turn === 'white' ? 'Black' : 'White'} wins`
                   )}
                   {game.status === 'draw' && 'Game ended in a draw'}
                   {game.status === 'stalemate' && 'Game ended in stalemate'}
                   {game.status === 'resigned' && (
                     `${game.winner === user.id ? 'You' : 'Opponent'} won by resignation`
                   )}
                 </p>
                 <button onClick={() => navigate('/play')}>
                   Back to Play
                 </button>
               </div>
             )}
           </div>
           
           {game.chat_enabled && (
             <GameChat gameId={gameId} />
           )}
         </div>
       </div>
     );
   }

   export default MultiplayerGame;
   ```
     }

     cleanup() {
       if (this.subscription) {
         supabase.removeChannel(this.subscription);
       }
     }
   }
   ```
       }
     }

     getGameStatus() {
       if (this.localGame.isCheckmate()) return 'checkmate';
       if (this.localGame.isDraw()) return 'draw';
       if (this.localGame.isStalemate()) return 'stalemate';
       return 'active';
     }

     cleanup() {
       if (this.subscription) {
         supabase.removeChannel(this.subscription);
       }
     }
   }
   ```
     FOR INSERT WITH CHECK (auth.uid() = sender_id);

   -- Recipients can update invitation status
   CREATE POLICY "Recipients can update invitation status" ON game_invitations
     FOR UPDATE USING (auth.uid() = recipient_id);