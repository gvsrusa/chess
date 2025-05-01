// Chess engine service using Stockfish-web
import Stockfish from 'stockfish-web';

class ChessEngine {
  constructor() {
    this.engine = null;
    this.isReady = false;
    this.onMessage = null;
    this.moveResolver = null;
    this.depth = 15; // Default depth for engine analysis
    this.engineSkill = 10; // Default skill level (1-20)
    this.initialized = false;
  }

  init() {
    if (this.initialized) return Promise.resolve();
    
    return new Promise((resolve) => {
      // Create engine instance from stockfish-web
      this.engine = new Stockfish();
      
      // Set up message handler
      this.engine.addEventListener('message', (event) => {
        const message = event.data;
        console.debug('[Stockfish]:', message);
        
        // Call the onMessage callback if provided
        if (this.onMessage) {
          this.onMessage(message);
        }
        
        // Check if the engine is ready
        if (message === 'readyok') {
          this.isReady = true;
        }
        
        // Check for "bestmove" responses
        if (message.startsWith('bestmove')) {
          const bestMove = message.split(' ')[1];
          if (this.moveResolver) {
            this.moveResolver(bestMove);
            this.moveResolver = null;
          }
        }
      });
      
      // Initialize the engine
      this.sendCommand('uci');
      this.sendCommand('isready');
      this.setDifficulty(this.engineSkill);
      
      this.initialized = true;
      resolve();
    });
  }

  // Set engine's difficulty level (1-20)
  setDifficulty(skill) {
    const clampedSkill = Math.max(1, Math.min(20, skill));
    this.engineSkill = clampedSkill;
    
    // Configure engine based on skill level
    this.sendCommand(`setoption name Skill Level value ${clampedSkill}`);
    
    // Adjust depth based on skill level
    this.depth = 5 + Math.floor(clampedSkill / 2);
  }

  // Send a command to the engine
  sendCommand(command) {
    if (!this.engine) {
      console.error('Chess engine not initialized');
      return;
    }
    
    this.engine.postMessage(command);
  }

  // Set a position using FEN string
  setPosition(fen) {
    this.sendCommand(`position fen ${fen}`);
  }

  // Get the best move for the current position
  async getBestMove(fen, timeLimit = 1000) {
    if (!this.initialized) await this.init();
    
    return new Promise((resolve) => {
      // Store the resolver to be called when we get a response
      this.moveResolver = resolve;
      
      // Set position and start search
      this.setPosition(fen);
      this.sendCommand(`go depth ${this.depth} movetime ${timeLimit}`);
    });
  }

  // Evaluate the current position
  evaluatePosition(fen) {
    if (!this.initialized) this.init();
    
    this.setPosition(fen);
    this.sendCommand(`go depth ${this.depth}`);
  }

  // Stop the engine's calculation
  stop() {
    this.sendCommand('stop');
  }

  // Clean up resources
  destroy() {
    if (this.engine) {
      this.sendCommand('quit');
      this.engine = null;
      this.isReady = false;
      this.initialized = false;
      this.moveResolver = null;
    }
  }
}

// Create a singleton instance
const chessEngine = new ChessEngine();

export default chessEngine;