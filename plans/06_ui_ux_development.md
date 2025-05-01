# Phase 6: UI/UX Development

## Overview

This phase focuses on implementing a polished, intuitive, and responsive user interface for the chess web application. It includes designing and implementing the overall layout, chess board interface, game controls, responsive design for multiple devices, and visual feedback elements.

## Objectives

- Create a cohesive and visually appealing design system
- Implement responsive layouts for various devices
- Design and implement an intuitive chess board interface
- Add visual feedback for moves, checks, and game status
- Create user-friendly navigation and game controls
- Implement accessibility features
- Add animations and transitions for a polished experience

## Tasks

### 1. Design System Implementation

1. **Create Design Tokens**
   - Define color palette, typography, spacing, and other design variables
   - Implement as CSS custom properties

   ```css
   /* src/styles/tokens.css */
   :root {
     /* Colors */
     --color-primary: #4d7ea8;
     --color-primary-light: #6e9cbf;
     --color-primary-dark: #2c5d8f;
     --color-secondary: #a87c4d;
     --color-secondary-light: #c9a47c;
     --color-secondary-dark: #8c5e2c;
     --color-background: #f5f5f5;
     --color-surface: #ffffff;
     --color-text: #333333;
     --color-text-light: #666666;
     --color-success: #4caf50;
     --color-warning: #ff9800;
     --color-error: #f44336;
     --color-info: #2196f3;
     
     /* Chess board colors */
     --color-board-light: #eeeed2;
     --color-board-dark: #769656;
     --color-board-highlight: rgba(255, 255, 0, 0.5);
     --color-board-check: rgba(255, 0, 0, 0.5);
     --color-board-selected: rgba(0, 0, 255, 0.3);
     
     /* Typography */
     --font-family-base: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Oxygen, Ubuntu, Cantarell, 'Open Sans', sans-serif;
     --font-family-heading: 'Montserrat', var(--font-family-base);
     --font-size-xs: 0.75rem;
     --font-size-sm: 0.875rem;
     --font-size-md: 1rem;
     --font-size-lg: 1.25rem;
     --font-size-xl: 1.5rem;
     --font-size-2xl: 2rem;
     --font-size-3xl: 2.5rem;
     
     /* Spacing */
     --spacing-xs: 0.25rem;
     --spacing-sm: 0.5rem;
     --spacing-md: 1rem;
     --spacing-lg: 1.5rem;
     --spacing-xl: 2rem;
     --spacing-2xl: 3rem;
     
     /* Borders */
     --border-radius-sm: 0.25rem;
     --border-radius-md: 0.5rem;
     --border-radius-lg: 1rem;
     --border-width-thin: 1px;
     --border-width-medium: 2px;
     --border-width-thick: 4px;
     
     /* Shadows */
     --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
     --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
     --shadow-lg: 0 10px 20px rgba(0, 0, 0, 0.1), 0 3px 6px rgba(0, 0, 0, 0.05);
     --shadow-inner: inset 0 2px 4px rgba(0, 0, 0, 0.06);
     
     /* Transitions */
     --transition-fast: 150ms ease-in-out;
     --transition-normal: 300ms ease-in-out;
     --transition-slow: 500ms ease-in-out;
     
     /* Z-index */
2. **Create Component Base Styles**
   - Implement base styles for common components
   - Create utility classes for layout and spacing

   ```css
   /* src/styles/components.css */
   @import './tokens.css';

   /* Button styles */
   .btn {
     display: inline-flex;
     align-items: center;
     justify-content: center;
     padding: var(--spacing-sm) var(--spacing-md);
     border-radius: var(--border-radius-md);
     font-size: var(--font-size-md);
     font-weight: 500;
     text-align: center;
     cursor: pointer;
     transition: all var(--transition-fast);
     border: none;
   }

   .btn-primary {
     background-color: var(--color-primary);
     color: white;
   }

   .btn-primary:hover {
     background-color: var(--color-primary-dark);
   }

   .btn-secondary {
     background-color: var(--color-secondary);
     color: white;
   }

   .btn-secondary:hover {
     background-color: var(--color-secondary-dark);
   }

   .btn-outline {
     background-color: transparent;
     border: var(--border-width-thin) solid var(--color-primary);
     color: var(--color-primary);
   }

   .btn-outline:hover {
     background-color: var(--color-primary);
     color: white;
   }

   /* Card styles */
   .card {
     background-color: var(--color-surface);
     border-radius: var(--border-radius-md);
     box-shadow: var(--shadow-md);
     padding: var(--spacing-lg);
   }

   /* Form styles */
   .form-group {
     margin-bottom: var(--spacing-md);
   }

   .form-label {
     display: block;
     margin-bottom: var(--spacing-xs);
     font-weight: 500;
   }

   .form-input {
     width: 100%;
     padding: var(--spacing-sm);
     border: var(--border-width-thin) solid var(--color-text-light);
     border-radius: var(--border-radius-sm);
     font-size: var(--font-size-md);
     transition: border-color var(--transition-fast);
   }

   .form-input:focus {
     outline: none;
     border-color: var(--color-primary);
     box-shadow: var(--shadow-inner);
   }

   /* Layout utilities */
   .container {
     width: 100%;
     max-width: 1200px;
     margin: 0 auto;
     padding: 0 var(--spacing-md);
   }

   .flex {
     display: flex;
   }

   .flex-col {
     flex-direction: column;
   }

   .items-center {
     align-items: center;
   }

   .justify-center {
     justify-content: center;
   }

   .justify-between {
     justify-content: space-between;
   }

   .gap-sm {
     gap: var(--spacing-sm);
   }

   .gap-md {
     gap: var(--spacing-md);
   }

   .gap-lg {
     gap: var(--spacing-lg);
   }
   ```

3. **Implement Global Styles**
   - Create reset and base styles
   - Set up responsive breakpoints

   ```css
   /* src/styles/global.css */
   @import './tokens.css';
   @import './components.css';

   /* Reset */
   *, *::before, *::after {
     box-sizing: border-box;
     margin: 0;
     padding: 0;
   }

   html {
     font-size: 16px;
     height: 100%;
   }

   body {
     font-family: var(--font-family-base);
     font-size: var(--font-size-md);
     line-height: 1.5;
     color: var(--color-text);
     background-color: var(--color-background);
     min-height: 100%;
   }
2. **Implement Navigation Component**
   - Create responsive navigation bar
   - Add mobile menu toggle

   ```javascript
   // src/components/UI/Navigation.jsx
   import React, { useState } from 'react';
   import { Link, useNavigate, useLocation } from 'react-router-dom';
   import { useAuth } from '../../contexts/AuthContext';
   import { useProfile } from '../../hooks/useProfile';
   import './Navigation.css';

   function Navigation() {
     const { isAuthenticated, signOut, user } = useAuth();
     const { profile } = useProfile();
     const navigate = useNavigate();
     const location = useLocation();
     const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
     
     const handleSignOut = async () => {
       await signOut();
       navigate('/');
       setMobileMenuOpen(false);
     };
     
     const toggleMobileMenu = () => {
       setMobileMenuOpen(!mobileMenuOpen);
     };
     
     const closeMobileMenu = () => {
       setMobileMenuOpen(false);
     };
     
     return (
       <nav className="navigation">
         <div className="container">
           <div className="nav-container">
             <div className="nav-logo">
               <Link to="/" onClick={closeMobileMenu}>
                 <img src="/logo.svg" alt="Chess App" />
                 <span>Chess App</span>
               </Link>
             </div>
             
             <button 
               className="mobile-menu-toggle" 
               onClick={toggleMobileMenu}
               aria-label="Toggle menu"
             >
               <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}></span>
             </button>
             
             <div className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
               <ul className="nav-links">
                 <li>
                   <Link 
                     to="/" 
                     className={location.pathname === '/' ? 'active' : ''}
                     onClick={closeMobileMenu}
                   >
                     Home
                   </Link>
                 </li>
                 <li>
                   <Link 
                     to="/play/computer" 
                     className={location.pathname.includes('/play/computer') ? 'active' : ''}
                     onClick={closeMobileMenu}
                   >
                     Play vs Computer
                   </Link>
                 </li>
                 {isAuthenticated && (
                   <li>
                     <Link 
                       to="/play/online" 
                       className={location.pathname.includes('/play/online') ? 'active' : ''}
                       onClick={closeMobileMenu}
                     >
                       Play Online
                     </Link>
                   </li>
                 )}
                 <li>
                   <Link 
                     to="/learn" 
                     className={location.pathname.includes('/learn') ? 'active' : ''}
                     onClick={closeMobileMenu}
                   >
                     Learn
                   </Link>
                 </li>
               </ul>
               
               <div className="nav-auth">
                 {isAuthenticated ? (
                   <div className="user-menu">
                     <div className="user-info">
                       {profile?.avatar_url ? (
                         <img 
                           src={profile.avatar_url} 
                           alt="Avatar" 
                           className="user-avatar"
                         />
                       ) : (
                         <div className="avatar-placeholder">
                           {profile?.username?.[0] || user?.email?.[0] || '?'}
                         </div>
                       )}
                       <span className="username">
                         {profile?.username || user?.email?.split('@')[0]}
                       </span>
                     </div>
                     
                     <div className="dropdown-menu">
                       <Link to="/profile" onClick={closeMobileMenu}>Profile</Link>
                       <Link to="/games" onClick={closeMobileMenu}>My Games</Link>
                       <button onClick={handleSignOut}>Sign Out</button>
                     </div>
                   </div>
                 ) : (
                   <Link 
                     to="/login" 
                     className="login-button"
                     onClick={closeMobileMenu}
                   >
                     Sign In
                   </Link>
                 )}
               </div>
             </div>
           </div>
         </div>
       </nav>
     );
   }

   export default Navigation;
   ```

3. **Create Footer Component**
   - Implement responsive footer
   - Add links and copyright information

   ```javascript
   // src/components/UI/Footer.jsx
   import React from 'react';
   import { Link } from 'react-router-dom';
   import './Footer.css';

   function Footer() {
     const currentYear = new Date().getFullYear();
     
     return (
       <footer className="footer">
         <div className="container">
           <div className="footer-content">
             <div className="footer-logo">
               <img src="/logo.svg" alt="Chess App" />
               <span>Chess App</span>
             </div>
             
             <div className="footer-links">
               <div className="footer-section">
                 <h4>Play</h4>
                 <ul>
                   <li><Link to="/play/computer">vs Computer</Link></li>
                   <li><Link to="/play/online">Online</Link></li>
                   <li><Link to="/play/friend">vs Friend</Link></li>
                 </ul>
               </div>
               
               <div className="footer-section">
                 <h4>Learn</h4>
                 <ul>
                   <li><Link to="/learn/basics">Chess Basics</Link></li>
                   <li><Link to="/learn/tactics">Tactics</Link></li>
                   <li><Link to="/learn/openings">Openings</Link></li>
                 </ul>
               </div>
               
               <div className="footer-section">
                 <h4>About</h4>
                 <ul>
                   <li><Link to="/about">About Us</Link></li>
                   <li><Link to="/contact">Contact</Link></li>
                   <li><Link to="/terms">Terms of Service</Link></li>
                   <li><Link to="/privacy">Privacy Policy</Link></li>
                 </ul>
               </div>
             </div>
           </div>
           
           <div className="footer-bottom">
             <p>&copy; {currentYear} Chess App. All rights reserved.</p>
             <div className="social-links">
               <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                 <i className="icon-twitter"></i>
               </a>
               <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                 <i className="icon-facebook"></i>
               </a>
               <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                 <i className="icon-instagram"></i>
               </a>
             </div>
           </div>
         </div>
       </footer>
     );
   }

   export default Footer;
   ```

### 3. Chess Board UI Enhancement

1. **Customize Chess Board Appearance**
   - Implement custom board themes
   - Add piece set options

   ```javascript
   // src/components/Chess/BoardTheme.jsx
   import React from 'react';
   import './BoardTheme.css';

   const BOARD_THEMES = [
     {
       id: 'green',
       name: 'Forest Green',
       lightSquare: '#eeeed2',
       darkSquare: '#769656'
     },
     {
       id: 'blue',
       name: 'Ocean Blue',
       lightSquare: '#eae9d2',
       darkSquare: '#4682b4'
     },
     {
       id: 'brown',
       name: 'Wooden',
       lightSquare: '#f0d9b5',
       darkSquare: '#b58863'
     },
     {
       id: 'gray',
       name: 'Grayscale',
       lightSquare: '#e6e6e6',
       darkSquare: '#808080'
     }
   ];

   const PIECE_SETS = [
     {
       id: 'standard',
       name: 'Standard'
     },
     {
       id: 'neo',
       name: 'Neo'
     },
     {
       id: 'alpha',
       name: 'Alpha'
     },
     {
       id: 'cburnett',
       name: 'CBurnett'
     }
   ];

   function BoardTheme({ currentTheme, currentPieceSet, onThemeChange, onPieceSetChange }) {
     return (
       <div className="board-theme-selector">
         <div className="theme-section">
           <h3>Board Theme</h3>
           <div className="theme-options">
             {BOARD_THEMES.map((theme) => (
               <div
                 key={theme.id}
                 className={`theme-option ${currentTheme === theme.id ? 'selected' : ''}`}
                 onClick={() => onThemeChange(theme.id)}
               >
                 <div 
                   className="theme-preview"
                   style={{
                     background: `linear-gradient(to right, ${theme.lightSquare} 50%, ${theme.darkSquare} 50%)`
                   }}
                 ></div>
                 <span>{theme.name}</span>
               </div>
             ))}
           </div>
         </div>
         
         <div className="theme-section">
           <h3>Piece Set</h3>
           <div className="piece-options">
             {PIECE_SETS.map((pieceSet) => (
2. **Implement Move Highlighting**
   - Add highlighting for selected pieces
   - Show valid move indicators
   - Highlight last move

   ```javascript
   // src/components/Chess/BoardHighlights.jsx
   import React from 'react';
   import './BoardHighlights.css';

   function BoardHighlights({ 
     selectedSquare, 
     validMoves, 
     lastMove, 
     checkSquare,
     squareSize 
   }) {
     // Generate highlights for valid moves
     const moveHighlights = validMoves.map((move) => {
       const { to } = move;
       const style = {
         width: squareSize,
         height: squareSize,
         left: getFilePosition(to) * squareSize,
         top: getRankPosition(to) * squareSize
       };
       
       return (
         <div 
           key={to} 
           className="valid-move-highlight" 
           style={style}
         ></div>
       );
     });
     
     // Generate highlight for selected square
     const selectedHighlight = selectedSquare ? (
       <div 
         className="selected-square-highlight" 
         style={{
           width: squareSize,
           height: squareSize,
           left: getFilePosition(selectedSquare) * squareSize,
           top: getRankPosition(selectedSquare) * squareSize
         }}
       ></div>
     ) : null;
     
     // Generate highlights for last move
     const lastMoveHighlights = lastMove ? (
       <>
         <div 
           className="last-move-highlight" 
           style={{
             width: squareSize,
             height: squareSize,
             left: getFilePosition(lastMove.from) * squareSize,
             top: getRankPosition(lastMove.from) * squareSize
           }}
         ></div>
         <div 
           className="last-move-highlight" 
           style={{
             width: squareSize,
             height: squareSize,
             left: getFilePosition(lastMove.to) * squareSize,
             top: getRankPosition(lastMove.to) * squareSize
           }}
         ></div>
       </>
     ) : null;
     
     // Generate highlight for check
     const checkHighlight = checkSquare ? (
       <div 
         className="check-highlight" 
         style={{
           width: squareSize,
           height: squareSize,
           left: getFilePosition(checkSquare) * squareSize,
           top: getRankPosition(checkSquare) * squareSize
         }}
       ></div>
     ) : null;
     
     return (
       <div className="board-highlights">
         {selectedHighlight}
         {moveHighlights}
         {lastMoveHighlights}
         {checkHighlight}
       </div>
     );
   }

   // Helper functions to convert chess notation to position
   function getFilePosition(square) {
     return square.charCodeAt(0) - 'a'.charCodeAt(0);
   }

   function getRankPosition(square) {
     return 8 - parseInt(square[1]);
   }

   export default BoardHighlights;
   ```

3. **Create Enhanced Chess Board Component**
   - Integrate custom themes and highlighting
   - Add coordinate labels
   - Implement responsive sizing

   ```javascript
   // src/components/Chess/EnhancedBoard.jsx
   import React, { useState, useEffect, useRef } from 'react';
   import { Chessboard } from 'react-chessboard';
   import BoardHighlights from './BoardHighlights';
   import './EnhancedBoard.css';

   function EnhancedBoard({
     position,
     onPieceDrop,
     boardOrientation = 'white',
     isDraggable = true,
     showCoordinates = true,
     customSquareStyles = {},
     selectedSquare = null,
     validMoves = [],
     lastMove = null,
     checkSquare = null,
     boardTheme = 'green',
     pieceSet = 'standard'
   }) {
     const [boardWidth, setBoardWidth] = useState(480);
     const [squareSize, setSquareSize] = useState(60);
     const containerRef = useRef(null);
     
     // Get board themes
     const getSquareStyles = () => {
       const themes = {
         green: { light: '#eeeed2', dark: '#769656' },
         blue: { light: '#eae9d2', dark: '#4682b4' },
         brown: { light: '#f0d9b5', dark: '#b58863' },
         gray: { light: '#e6e6e6', dark: '#808080' }
       };
       
       return themes[boardTheme] || themes.green;
     };
     
     // Handle responsive sizing
     useEffect(() => {
       const handleResize = () => {
         if (containerRef.current) {
           const containerWidth = containerRef.current.offsetWidth;
           const newBoardWidth = Math.min(containerWidth, 600);
           setBoardWidth(newBoardWidth);
           setSquareSize(newBoardWidth / 8);
         }
       };
       
       handleResize();
       window.addEventListener('resize', handleResize);
       
       return () => {
         window.removeEventListener('resize', handleResize);
       };
     }, []);
     
     const squareStyles = getSquareStyles();
     
     return (
       <div className="enhanced-board-container" ref={containerRef}>
         <div 
           className="enhanced-board"
           style={{ width: boardWidth, height: boardWidth }}
         >
           <Chessboard
             position={position}
             onPieceDrop={onPieceDrop}
             boardOrientation={boardOrientation}
             boardWidth={boardWidth}
             isDraggable={isDraggable}
             customDarkSquareStyle={{ backgroundColor: squareStyles.dark }}
             customLightSquareStyle={{ backgroundColor: squareStyles.light }}
             customSquareStyles={customSquareStyles}
             customPieces={pieceSet !== 'standard' ? {
               wP: () => <img src={`/pieces/${pieceSet}/wP.svg`} alt="White Pawn" />,
               wN: () => <img src={`/pieces/${pieceSet}/wN.svg`} alt="White Knight" />,
               wB: () => <img src={`/pieces/${pieceSet}/wB.svg`} alt="White Bishop" />,
               wR: () => <img src={`/pieces/${pieceSet}/wR.svg`} alt="White Rook" />,
               wQ: () => <img src={`/pieces/${pieceSet}/wQ.svg`} alt="White Queen" />,
               wK: () => <img src={`/pieces/${pieceSet}/wK.svg`} alt="White King" />,
               bP: () => <img src={`/pieces/${pieceSet}/bP.svg`} alt="Black Pawn" />,
               bN: () => <img src={`/pieces/${pieceSet}/bN.svg`} alt="Black Knight" />,
               bB: () => <img src={`/pieces/${pieceSet}/bB.svg`} alt="Black Bishop" />,
               bR: () => <img src={`/pieces/${pieceSet}/bR.svg`} alt="Black Rook" />,
               bQ: () => <img src={`/pieces/${pieceSet}/bQ.svg`} alt="Black Queen" />,
               bK: () => <img src={`/pieces/${pieceSet}/bK.svg`} alt="Black King" />
             } : undefined}
           />
           
           <BoardHighlights
             selectedSquare={selectedSquare}
             validMoves={validMoves}
             lastMove={lastMove}
             checkSquare={checkSquare}
             squareSize={squareSize}
           />
           
           {showCoordinates && (
             <div className="board-coordinates">
               {/* File coordinates (a-h) */}
               <div className="file-coordinates">
                 {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((file, index) => (
                   <div 
                     key={file} 
                     className="coordinate-label"
                     style={{
                       left: (index * squareSize) + (squareSize / 2),
                       color: index % 2 === (boardOrientation === 'white' ? 0 : 1) ? squareStyles.dark : squareStyles.light
                     }}
                   >
                     {file}
                   </div>
                 ))}
               </div>
               
               {/* Rank coordinates (1-8) */}
               <div className="rank-coordinates">
                 {[8, 7, 6, 5, 4, 3, 2, 1].map((rank, index) => (
                   <div 
                     key={rank} 
                     className="coordinate-label"
                     style={{
                       top: (index * squareSize) + (squareSize / 2),
                       color: index % 2 === (boardOrientation === 'white' ? 0 : 1) ? squareStyles.dark : squareStyles.light
                     }}
                   >
                     {rank}
                   </div>
                 ))}
               </div>
             </div>
           )}
         </div>
       </div>
     );
   }

   export default EnhancedBoard;
   ```

### 4. Game Controls and Status UI

1. **Implement Enhanced Game Controls**
   - Create intuitive control panel
   - Add tooltips and visual feedback

   ```javascript
   // src/components/Chess/GameControls.jsx
   import React from 'react';
   import './GameControls.css';

   function GameControls({
     onNewGame,
     onUndoMove,
     onFlipBoard,
     onResign,
     onOfferDraw,
     gameOver,
     showSettings,
     onToggleSettings
   }) {
     return (
       <div className="game-controls">
         <div className="control-group">
           <button
             className="control-button"
             onClick={onNewGame}
             title="Start a new game"
           >
             <i className="icon-new-game"></i>
             <span>New Game</span>
           </button>
           
           <button
             className="control-button"
             onClick={onUndoMove}
             disabled={gameOver}
             title="Undo the last move"
           >
             <i className="icon-undo"></i>
             <span>Undo</span>
           </button>
           
           <button
             className="control-button"
             onClick={onFlipBoard}
             title="Flip the board"
           >
             <i className="icon-flip"></i>
             <span>Flip Board</span>
           </button>
         </div>
         
         <div className="control-group">
           <button
             className="control-button"
             onClick={onResign}
             disabled={gameOver}
             title="Resign the game"
           >
             <i className="icon-resign"></i>
             <span>Resign</span>
           </button>
           
           <button
             className="control-button"
             onClick={onOfferDraw}
             disabled={gameOver}
             title="Offer a draw"
           >
             <i className="icon-draw"></i>
             <span>Offer Draw</span>
           </button>
           
           <button
             className="control-button"
             onClick={onToggleSettings}
             title="Game settings"
           >
             <i className="icon-settings"></i>
             <span>Settings</span>
           </button>
         </div>
       </div>
     );
   }

   export default GameControls;
   ```
               <div
                 key={pieceSet.id}
                 className={`piece-option ${currentPieceSet === pieceSet.id ? 'selected' : ''}`}
                 onClick={() => onPieceSetChange(pieceSet.id)}
               >
                 <div className="piece-preview">
                   <img 
                     src={`/pieces/${pieceSet.id}/wN.svg`} 
                     alt={`White Knight - ${pieceSet.name}`}
                     className="piece-preview-item"
                   />
                   <img 
2. **Create Game Status Display**
   - Implement visual indicators for game state
   - Add player information display

   ```javascript
   // src/components/Chess/GameStatus.jsx
   import React from 'react';
   import './GameStatus.css';

   function GameStatus({
     turn,
     inCheck,
     isCheckmate,
     isDraw,
     isStalemate,
     isResigned,
     winner
   }) {
     let statusText = '';
     let statusClass = '';
     
     if (isCheckmate) {
       statusText = `Checkmate! ${winner || (turn === 'white' ? 'Black' : 'White')} wins`;
       statusClass = 'status-checkmate';
     } else if (isDraw) {
       statusText = 'Game ended in a draw';
       statusClass = 'status-draw';
     } else if (isStalemate) {
       statusText = 'Stalemate';
       statusClass = 'status-draw';
     } else if (isResigned) {
       statusText = `${winner || (turn === 'white' ? 'Black' : 'White')} wins by resignation`;
       statusClass = 'status-resigned';
     } else if (inCheck) {
       statusText = `${turn === 'white' ? 'White' : 'Black'} is in check`;
       statusClass = 'status-check';
     } else {
       statusText = `${turn === 'white' ? 'White' : 'Black'} to move`;
       statusClass = 'status-normal';
     }
     
     return (
       <div className={`game-status ${statusClass}`}>
         <div className="status-icon">
           {isCheckmate && <i className="icon-checkmate"></i>}
           {isDraw && <i className="icon-draw"></i>}
           {isStalemate && <i className="icon-stalemate"></i>}
           {isResigned && <i className="icon-resigned"></i>}
           {inCheck && !isCheckmate && <i className="icon-check"></i>}
           {!inCheck && !isCheckmate && !isDraw && !isStalemate && !isResigned && (
             <i className={`icon-${turn === 'white' ? 'white' : 'black'}-turn`}></i>
           )}
         </div>
         <div className="status-text">{statusText}</div>
       </div>
     );
   }

   export default GameStatus;
   ```

3. **Implement Player Information Component**
   - Display player avatars and names
   - Show ratings and game statistics

   ```javascript
   // src/components/Chess/PlayerInfo.jsx
   import React from 'react';
   import { useProfile } from '../../hooks/useProfile';
   import './PlayerInfo.css';

   function PlayerInfo({ playerId, isActive, isCurrentUser, timeLeft }) {
     const { profile, loading } = useProfile(playerId);
     
     if (loading) {
       return (
         <div className={`player-info ${isActive ? 'active' : ''}`}>
           <div className="player-avatar skeleton"></div>
           <div className="player-details">
             <div className="player-name skeleton"></div>
             <div className="player-rating skeleton"></div>
           </div>
         </div>
       );
     }
     
     return (
       <div className={`player-info ${isActive ? 'active' : ''} ${isCurrentUser ? 'current-user' : ''}`}>
         <div className="player-avatar">
           {profile?.avatar_url ? (
             <img src={profile.avatar_url} alt={`${profile.username}'s avatar`} />
           ) : (
             <div className="avatar-placeholder">
               {profile?.username?.[0] || '?'}
             </div>
           )}
         </div>
         
         <div className="player-details">
           <div className="player-name">
             {profile?.username || 'Unknown Player'}
             {isCurrentUser && <span className="current-user-indicator">(You)</span>}
           </div>
           <div className="player-rating">
             Rating: {profile?.rating || '?'}
           </div>
         </div>
         
         {timeLeft !== undefined && (
           <div className="player-time">
             {formatTime(timeLeft)}
           </div>
         )}
       </div>
     );
   }

   function formatTime(seconds) {
     const mins = Math.floor(seconds / 60);
     const secs = seconds % 60;
     return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
   }

   export default PlayerInfo;
   ```

### 5. Responsive Design Implementation

1. **Create Responsive Layouts**
   - Implement mobile-first design approach
   - Add breakpoints for different device sizes

   ```css
   /* src/styles/responsive.css */
   /* Mobile-first base styles */
   .chess-game-container {
     display: flex;
     flex-direction: column;
     gap: var(--spacing-md);
     padding: var(--spacing-md);
   }

   .game-board-section {
     width: 100%;
   }

   .game-info-section {
     width: 100%;
   }

   .game-controls {
     display: flex;
     flex-wrap: wrap;
     gap: var(--spacing-sm);
   }

   .control-button {
     flex: 1 0 calc(33.333% - var(--spacing-sm));
   }

   /* Tablet (medium screens) */
   @media (min-width: 768px) {
     .chess-game-container {
       padding: var(--spacing-lg);
     }
     
     .control-button {
       flex: 0 0 auto;
     }
   }

   /* Desktop (large screens) */
   @media (min-width: 1024px) {
     .chess-game-container {
       flex-direction: row;
       align-items: flex-start;
     }
     
     .game-board-section {
       width: 65%;
     }
     
     .game-info-section {
       width: 35%;
     }
   }

   /* Large desktop */
   @media (min-width: 1440px) {
     .chess-game-container {
       max-width: 1400px;
       margin: 0 auto;
     }
   }
   ```

2. **Implement Responsive Navigation**
   - Create mobile menu
   - Add responsive behavior for different screen sizes

   ```css
   /* src/components/UI/Navigation.css */
   .navigation {
     background-color: var(--color-surface);
     box-shadow: var(--shadow-md);
     position: sticky;
     top: 0;
     z-index: var(--z-index-dropdown);
   }

   .nav-container {
     display: flex;
     justify-content: space-between;
     align-items: center;
     padding: var(--spacing-md) 0;
   }

   .nav-logo {
     display: flex;
     align-items: center;
     gap: var(--spacing-sm);
   }

   .nav-logo img {
     height: 32px;
   }

   .mobile-menu-toggle {
     display: block;
     background: none;
     border: none;
     cursor: pointer;
     padding: var(--spacing-sm);
   }

   .hamburger {
     display: block;
     width: 24px;
     height: 2px;
     background-color: var(--color-text);
     position: relative;
     transition: background-color var(--transition-fast);
   }

   .hamburger::before,
   .hamburger::after {
     content: '';
     position: absolute;
     width: 24px;
     height: 2px;
     background-color: var(--color-text);
     transition: transform var(--transition-fast);
   }

   .hamburger::before {
     top: -8px;
   }

   .hamburger::after {
     bottom: -8px;
   }

   .hamburger.open {
     background-color: transparent;
   }

   .hamburger.open::before {
     transform: rotate(45deg);
     top: 0;
   }

   .hamburger.open::after {
     transform: rotate(-45deg);
     bottom: 0;
   }

   .nav-menu {
     position: absolute;
     top: 100%;
     left: 0;
     right: 0;
     background-color: var(--color-surface);
     box-shadow: var(--shadow-md);
     padding: var(--spacing-md);
     display: none;
     flex-direction: column;
     gap: var(--spacing-md);
   }

   .nav-menu.open {
     display: flex;
   }

   .nav-links {
     list-style: none;
     display: flex;
     flex-direction: column;
     gap: var(--spacing-md);
   }

   .nav-links a {
     display: block;
     padding: var(--spacing-sm);
     color: var(--color-text);
     font-weight: 500;
     transition: color var(--transition-fast);
   }

   .nav-links a:hover,
   .nav-links a.active {
     color: var(--color-primary);
   }

   .nav-auth {
     display: flex;
     justify-content: center;
   }

   .login-button {
     display: inline-block;
     padding: var(--spacing-sm) var(--spacing-md);
     background-color: var(--color-primary);
     color: white;
     border-radius: var(--border-radius-md);
     font-weight: 500;
   }

   .user-menu {
     position: relative;
   }

   .user-info {
     display: flex;
     align-items: center;
     gap: var(--spacing-sm);
     cursor: pointer;
     padding: var(--spacing-sm);
   }

   .user-avatar,
   .avatar-placeholder {
     width: 32px;
     height: 32px;
     border-radius: 50%;
     overflow: hidden;
   }

   .avatar-placeholder {
     background-color: var(--color-primary);
     color: white;
     display: flex;
     align-items: center;
     justify-content: center;
     font-weight: 500;
   }

   .dropdown-menu {
     position: absolute;
     top: 100%;
     right: 0;
     background-color: var(--color-surface);
     box-shadow: var(--shadow-md);
     border-radius: var(--border-radius-md);
     min-width: 200px;
     display: none;
     flex-direction: column;
     overflow: hidden;
   }

   .user-menu:hover .dropdown-menu {
     display: flex;
   }

   .dropdown-menu a,
   .dropdown-menu button {
     padding: var(--spacing-md);
     text-align: left;
     background: none;
     border: none;
     cursor: pointer;
     font-size: var(--font-size-md);
     color: var(--color-text);
     transition: background-color var(--transition-fast);
   }

   .dropdown-menu a:hover,
   .dropdown-menu button:hover {
     background-color: var(--color-background);
   }

   /* Tablet and desktop */
   @media (min-width: 768px) {
     .mobile-menu-toggle {
       display: none;
     }
     
     .nav-menu {
       position: static;
       display: flex;
       flex-direction: row;
       justify-content: space-between;
       align-items: center;
       background-color: transparent;
       box-shadow: none;
       padding: 0;
     }
     
     .nav-links {
       flex-direction: row;
       gap: var(--spacing-lg);
     }
     
     .nav-links a {
       padding: 0;
     }
   }
   ```

### 6. Accessibility Implementation

1. **Add Keyboard Navigation**
   - Implement focus management
   - Add keyboard shortcuts

   ```javascript
   // src/utils/keyboardNavigation.js
   export const KEYBOARD_SHORTCUTS = {
     NEW_GAME: 'n',
     UNDO_MOVE: 'u',
     FLIP_BOARD: 'f',
     RESIGN: 'r',
     OFFER_DRAW: 'd',
     SETTINGS: 's',
     HELP: 'h'
   };

   export function setupKeyboardShortcuts(handlers) {
     const handleKeyDown = (e) => {
       // Ignore keyboard shortcuts when focus is in input elements
       if (
         e.target.tagName === 'INPUT' ||
         e.target.tagName === 'TEXTAREA' ||
         e.target.isContentEditable
       ) {
         return;
       }
       
       const key = e.key.toLowerCase();
       
       switch (key) {
         case KEYBOARD_SHORTCUTS.NEW_GAME:
           if (handlers.onNewGame) handlers.onNewGame();
           break;
         case KEYBOARD_SHORTCUTS.UNDO_MOVE:
           if (handlers.onUndoMove) handlers.onUndoMove();
           break;
         case KEYBOARD_SHORTCUTS.FLIP_BOARD:
           if (handlers.onFlipBoard) handlers.onFlipBoard();
           break;
         case KEYBOARD_SHORTCUTS.RESIGN:
           if (handlers.onResign) handlers.onResign();
           break;
         case KEYBOARD_SHORTCUTS.OFFER_DRAW:
           if (handlers.onOfferDraw) handlers.onOfferDraw();
           break;
         case KEYBOARD_SHORTCUTS.SETTINGS:
           if (handlers.onToggleSettings) handlers.onToggleSettings();
           break;
         case KEYBOARD_SHORTCUTS.HELP:
           if (handlers.onShowHelp) handlers.onShowHelp();
           break;
         default:
           break;
       }
     };
     
     window.addEventListener('keydown', handleKeyDown);
     
     return () => {
       window.removeEventListener('keydown', handleKeyDown);
     };
   }
   ```

2. **Implement ARIA Attributes**
   - Add proper ARIA roles and labels
   - Ensure screen reader compatibility

   ```javascript
   // Example of ARIA implementation in the chess board
   function AccessibleChessBoard({ position, onSquareClick, boardOrientation }) {
     // Generate the chess board with proper ARIA attributes
     const renderSquare = (square, piece) => {
       const file = square[0];
       const rank = square[1];
       const isWhiteSquare = (file.charCodeAt(0) - 'a'.charCodeAt(0) + parseInt(rank)) % 2 === 0;
       const squareColor = isWhiteSquare ? 'white' : 'black';
       const pieceInfo = piece ? `${piece.color} ${getPieceName(piece.type)}` : '';
       
       return (
         <div
           key={square}
           className={`chess-square ${squareColor}`}
           onClick={() => onSquareClick(square)}
           role="button"
           aria-label={`${file}${rank}${pieceInfo ? `, ${pieceInfo}` : ''}`}
           tabIndex={0}
         >
           {piece && (
             <div 
               className={`chess-piece ${piece.color} ${piece.type}`}
               role="img"
               aria-label={pieceInfo}
             />
           )}
         </div>
       );
     };
     
     // Helper function to get piece name
     const getPieceName = (type) => {
       switch (type) {
         case 'p': return 'pawn';
         case 'n': return 'knight';
         case 'b': return 'bishop';
         case 'r': return 'rook';
         case 'q': return 'queen';
         case 'k': return 'king';
         default: return type;
       }
     };
     
     // Render the board
     return (
       <div 
         className="accessible-chess-board"
         role="grid"
         aria-label="Chess board"
       >
         {/* Render board squares */}
       </div>
     );
   }
   ```

### 7. Animations and Transitions

1. **Implement Move Animations**
   - Add smooth piece movement
   - Create capture animations

   ```javascript
   // src/components/Chess/MoveAnimation.jsx
   import React, { useEffect, useState } from 'react';
   import './MoveAnimation.css';

   function MoveAnimation({ move, squareSize, onAnimationComplete }) {
     const [animationStyle, setAnimationStyle] = useState({});
     
     useEffect(() => {
       if (!move) return;
       
       const fromFile = move.from.charCodeAt(0) - 'a'.charCodeAt(0);
       const fromRank = 8 - parseInt(move.from[1]);
       const toFile = move.to.charCodeAt(0) - 'a'.charCodeAt(0);
       const toRank = 8 - parseInt(move.to[1]);
       
       const fromX = fromFile * squareSize;
       const fromY = fromRank * squareSize;
       const toX = toFile * squareSize;
       const toY = toRank * squareSize;
       
       const translateX = toX - fromX;
       const translateY = toY - fromY;
       
       setAnimationStyle({
         width: squareSize,
         height: squareSize,
         left: fromX,
         top: fromY,
         transform: `translate(${translateX}px, ${translateY}px)`
       });
       
       const timer = setTimeout(() => {
         if (onAnimationComplete) {
           onAnimationComplete();
         }
       }, 300); // Animation duration
       
       return () => clearTimeout(timer);
     }, [move, squareSize, onAnimationComplete]);
     
     if (!move) return null;
     
     return (
       <div 
         className="move-animation"
         style={animationStyle}
       >
         <div className={`piece ${move.piece}`}></div>
       </div>
     );
   }

   export default MoveAnimation;
   ```

2. **Add UI Transitions**
   - Implement smooth transitions between states
   - Add hover and active state animations

   ```css
   /* src/styles/animations.css */
   /* Fade in animation */
   @keyframes fadeIn {
     from {
       opacity: 0;
     }
     to {
       opacity: 1;
     }
   }

   .fade-in {
     animation: fadeIn var(--transition-normal);
   }

   /* Slide in animation */
   @keyframes slideIn {
     from {
       transform: translateY(-20px);
       opacity: 0;
     }
     to {
       transform: translateY(0);
       opacity: 1;
     }
   }

   .slide-in {
     animation: slideIn var(--transition-normal);
   }

   /* Pulse animation */
   @keyframes pulse {
     0% {
       transform: scale(1);
     }
     50% {
       transform: scale(1.05);
     }
     100% {
       transform: scale(1);
     }
   }

   .pulse {
     animation: pulse 1s infinite;
   }

   /* Rotate animation */
   @keyframes rotate {
     from {
       transform: rotate(0deg);
     }
     to {
       transform: rotate(360deg);
     }
   }

   .rotate {
     animation: rotate 1s linear infinite;
   }

   /* Shake animation */
   @keyframes shake {
     0%, 100% {
       transform: translateX(0);
     }
     10%, 30%, 50%, 70%, 90% {
       transform: translateX(-5px);
     }
     20%, 40%, 60%, 80% {
       transform: translateX(5px);
     }
   }

   .shake {
     animation: shake 0.5s;
   }
   ```

## Deliverables

- Comprehensive design system with tokens and base styles
- Responsive layout and navigation components
- Enhanced chess board with custom themes and highlighting
- Game controls and status UI components
- Player information display
- Accessibility features including keyboard navigation and ARIA attributes
- Animations and transitions for improved user experience
- Responsive design for mobile, tablet, and desktop devices
- CSS styles and utility classes for consistent UI

## Dependencies

- Completed Chess Game Core phase
- React.js environment
- react-chessboard library
- CSS3 support for animations and transitions

## Timeline

- **Estimated Duration**: 3 weeks
- **Effort**: 120 person-hours

## Success Criteria

- UI is visually appealing and consistent across the application
- Chess board is intuitive and provides clear visual feedback
- Application is responsive and works well on mobile, tablet, and desktop devices
- UI components are accessible and can be navigated using keyboard
- Animations and transitions enhance the user experience without being distracting
- Game state and player information is clearly displayed
- Design system is modular and can be easily extended

## Next Steps

After completing this phase, proceed to [Phase 7: Testing and Quality Assurance](07_testing_qa.md).
                     src={`/pieces/${pieceSet.id}/bQ.svg`} 
                     alt={`Black Queen - ${pieceSet.name}`}
                     className="piece-preview-item"
                   />
                 </div>
                 <span>{pieceSet.name}</span>
               </div>
             ))}
           </div>
         </div>
       </div>
     );
   }

   export default BoardTheme;
   ```

   h1, h2, h3, h4, h5, h6 {
     font-family: var(--font-family-heading);
     margin-bottom: var(--spacing-md);
     font-weight: 600;
     line-height: 1.2;
   }

   h1 {
     font-size: var(--font-size-3xl);
   }

   h2 {
     font-size: var(--font-size-2xl);
   }

   h3 {
     font-size: var(--font-size-xl);
   }

   p {
     margin-bottom: var(--spacing-md);
   }

   a {
     color: var(--color-primary);
     text-decoration: none;
     transition: color var(--transition-fast);
   }

   a:hover {
     color: var(--color-primary-dark);
   }

   img {
     max-width: 100%;
     height: auto;
   }

   /* Responsive breakpoints */
   @media (max-width: 640px) {
     html {
       font-size: 14px;
     }
   }

   @media (min-width: 641px) and (max-width: 1024px) {
     html {
       font-size: 15px;
     }
   }

   @media (min-width: 1025px) {
     html {
       font-size: 16px;
     }
   }
   ```

### 2. Layout and Navigation

1. **Create App Layout Component**
   - Implement responsive layout structure
   - Add header, main content, and footer

   ```javascript
   // src/components/UI/Layout.jsx
   import React from 'react';
   import { Outlet } from 'react-router-dom';
   import Navigation from './Navigation';
   import Footer from './Footer';

   function Layout() {
     return (
       <div className="app-layout">
         <Navigation />
         <main className="main-content">
           <Outlet />
         </main>
         <Footer />
       </div>
     );
   }

   export default Layout;
   ```
     --z-index-dropdown: 1000;
     --z-index-modal: 2000;
     --z-index-tooltip: 3000;
   }