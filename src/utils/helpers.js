// Helper functions for the chess application

/**
 * Format a timestamp into a human-readable date and time
 * @param {string|number|Date} timestamp - The timestamp to format
 * @returns {string} Formatted date string
 */
export const formatDate = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  return date.toLocaleString();
};

/**
 * Calculate the rating change based on game outcome and opponent rating
 * Using a simplified Elo rating system
 * 
 * @param {number} playerRating - Current rating of the player
 * @param {number} opponentRating - Rating of the opponent
 * @param {string} outcome - Game outcome: 'win', 'loss', or 'draw'
 * @returns {number} Rating change (positive or negative)
 */
export const calculateRatingChange = (playerRating, opponentRating, outcome) => {
  const K = 32; // K-factor
  
  // Expected score based on rating difference
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  
  let actualScore;
  switch (outcome) {
    case 'win':
      actualScore = 1;
      break;
    case 'draw':
      actualScore = 0.5;
      break;
    case 'loss':
      actualScore = 0;
      break;
    default:
      return 0;
  }
  
  return Math.round(K * (actualScore - expectedScore));
};

/**
 * Convert chess.js move to algebraic notation
 * @param {Object} move - Move object from chess.js
 * @returns {string} Move in algebraic notation
 */
export const formatMove = (move) => {
  if (!move) return '';
  return move.san || `${move.from}-${move.to}`;
};

/**
 * Get the game status message based on the chess game state
 * @param {Object} gameState - Current game state
 * @param {string} playerColor - Player's color ('w' or 'b')
 * @returns {string} Status message
 */
export const getGameStatusMessage = (gameState, playerColor) => {
  if (!gameState) return 'Game not started';
  
  if (gameState.isCheckmate) {
    const winner = gameState.turn === 'w' ? 'Black' : 'White';
    return `Checkmate! ${winner} wins.`;
  }
  
  if (gameState.isDraw) {
    if (gameState.isStalemate) return 'Game drawn by stalemate.';
    if (gameState.isThreefoldRepetition) return 'Game drawn by repetition.';
    if (gameState.isInsufficientMaterial) return 'Game drawn by insufficient material.';
    return 'Game drawn.';
  }
  
  if (gameState.inCheck) {
    return `${gameState.turn === 'w' ? 'White' : 'Black'} is in check.`;
  }
  
  return `${gameState.turn === 'w' ? 'White' : 'Black'} to move.`;
};

/**
 * Convert between FEN string and simplified board representation
 * @param {string} fen - FEN string
 * @returns {Object} Simplified board representation
 */
export const parseFEN = (fen) => {
  if (!fen) return null;
  
  const [board, turn, castling, enPassant, halfMoveClock, fullMoveNumber] = fen.split(' ');
  
  return {
    board,
    turn,
    castling,
    enPassant,
    halfMoveClock: parseInt(halfMoveClock, 10),
    fullMoveNumber: parseInt(fullMoveNumber, 10)
  };
};

/**
 * Get piece color and type from FEN character
 * @param {string} piece - FEN piece character
 * @returns {Object} Piece information with color and type
 */
export const getPieceInfo = (piece) => {
  if (!piece || piece === ' ') return null;
  
  const color = piece === piece.toUpperCase() ? 'white' : 'black';
  let type;
  
  switch (piece.toLowerCase()) {
    case 'p':
      type = 'pawn';
      break;
    case 'r':
      type = 'rook';
      break;
    case 'n':
      type = 'knight';
      break;
    case 'b':
      type = 'bishop';
      break;
    case 'q':
      type = 'queen';
      break;
    case 'k':
      type = 'king';
      break;
    default:
      return null;
  }
  
  return { color, type };
};

/**
 * Validates an email address
 * @param {string} email - Email address to validate
 * @returns {boolean} Whether the email is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};