# Phase 7: Testing and Quality Assurance

## Overview

This phase focuses on implementing comprehensive testing and quality assurance processes for the chess web application. It includes setting up testing frameworks, writing unit tests, integration tests, and end-to-end tests, as well as implementing performance optimization and accessibility testing.

## Objectives

- Set up testing frameworks and tools
- Implement unit tests for core components and functions
- Create integration tests for feature workflows
- Implement end-to-end tests for critical user journeys
- Perform cross-browser and cross-device testing
- Conduct performance optimization
- Implement accessibility testing
- Set up continuous integration for automated testing

## Tasks

### 1. Testing Environment Setup

1. **Configure Jest for Unit and Integration Testing**
   - Install and configure Jest
   - Set up test utilities and mocks

   ```bash
   # Install Jest and testing utilities
   npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
   ```

   ```javascript
   // jest.config.js
   module.exports = {
     testEnvironment: 'jsdom',
     setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
     moduleNameMapper: {
       '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
       '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js'
     },
     transform: {
       '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
     },
     collectCoverageFrom: [
       'src/**/*.{js,jsx,ts,tsx}',
       '!src/**/*.d.ts',
       '!src/index.js',
       '!src/reportWebVitals.js'
     ],
     coverageThreshold: {
       global: {
         statements: 70,
         branches: 70,
         functions: 70,
         lines: 70
       }
     }
   };
```javascript
   // src/setupTests.js
   import '@testing-library/jest-dom';

   // Mock Supabase
   jest.mock('./services/supabaseClient', () => ({
     supabase: {
       auth: {
         signInWithOAuth: jest.fn(),
         signOut: jest.fn(),
         getSession: jest.fn(),
         onAuthStateChange: jest.fn(() => ({
           data: { subscription: { unsubscribe: jest.fn() } }
         }))
       },
       from: jest.fn(() => ({
         select: jest.fn(() => ({
           eq: jest.fn(() => ({
             single: jest.fn(),
             limit: jest.fn(() => ({
               single: jest.fn()
             }))
           })),
           order: jest.fn(() => ({
             limit: jest.fn()
           }))
         })),
         insert: jest.fn(() => ({
           select: jest.fn(() => ({
             single: jest.fn()
           }))
         })),
         update: jest.fn(() => ({
           eq: jest.fn(() => ({
             select: jest.fn(() => ({
               single: jest.fn()
             }))
           }))
         })),
         delete: jest.fn(() => ({
           eq: jest.fn(),
           in: jest.fn()
         }))
       }),
       channel: jest.fn(() => ({
         on: jest.fn(() => ({
           on: jest.fn(() => ({
             subscribe: jest.fn()
           })),
           subscribe: jest.fn()
         })),
         subscribe: jest.fn()
       })),
       removeChannel: jest.fn()
     }
   }));

   // Mock chess.js
   jest.mock('chess.js', () => {
     return {
       Chess: jest.fn().mockImplementation(() => ({
         load: jest.fn(),
         fen: jest.fn(() => 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
         move: jest.fn(() => true),
         moves: jest.fn(() => []),
         history: jest.fn(() => []),
         turn: jest.fn(() => 'w'),
         inCheck: jest.fn(() => false),
         isCheckmate: jest.fn(() => false),
         isDraw: jest.fn(() => false),
         isStalemate: jest.fn(() => false),
         isThreefoldRepetition: jest.fn(() => false),
         isInsufficientMaterial: jest.fn(() => false),
         isGameOver: jest.fn(() => false),
         undo: jest.fn()
       }))
     };
   });

   // Mock window.matchMedia
   Object.defineProperty(window, 'matchMedia', {
     writable: true,
     value: jest.fn().mockImplementation(query => ({
       matches: false,
       media: query,
       onchange: null,
       addListener: jest.fn(),
       removeListener: jest.fn(),
       addEventListener: jest.fn(),
       removeEventListener: jest.fn(),
       dispatchEvent: jest.fn(),
     })),
   });

   // Mock IntersectionObserver
   class MockIntersectionObserver {
     constructor(callback) {
       this.callback = callback;
     }
     observe() {}
     unobserve() {}
     disconnect() {}
   }
   window.IntersectionObserver = MockIntersectionObserver;
   ```

2. **Set Up Cypress for End-to-End Testing**
   - Install and configure Cypress
   - Create base test configuration

   ```bash
   # Install Cypress
   npm install --save-dev cypress
   ```

   ```javascript
   // cypress.config.js
   const { defineConfig } = require('cypress');

   module.exports = defineConfig({
     e2e: {
       baseUrl: 'http://localhost:3000',
       setupNodeEvents(on, config) {
         // implement node event listeners here
       },
     },
     viewportWidth: 1280,
     viewportHeight: 720,
     video: false,
     screenshotOnRunFailure: true,
     chromeWebSecurity: false
   });
   ```

   ```javascript
   // cypress/support/commands.js
   // Custom Cypress commands

   // Command to login
   Cypress.Commands.add('login', (email, password) => {
     cy.visit('/login');
     cy.get('[data-cy=email-input]').type(email);
     cy.get('[data-cy=password-input]').type(password);
     cy.get('[data-cy=login-button]').click();
     cy.url().should('not.include', '/login');
   });

   // Command to create a new game
   Cypress.Commands.add('createNewGame', () => {
     cy.visit('/play/computer');
     cy.get('[data-cy=new-game-button]').click();
     cy.get('[data-cy=chess-board]').should('be.visible');
   });
   ```

3. **Configure ESLint and Prettier**
   - Set up linting rules
   - Configure code formatting

   ```bash
   # Install ESLint and Prettier
   npm install --save-dev eslint eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y eslint-plugin-import prettier eslint-config-prettier eslint-plugin-prettier
   ```

   ```javascript
   // .eslintrc.js
   module.exports = {
     env: {
       browser: true,
       es2021: true,
       jest: true,
     },
     extends: [
       'eslint:recommended',
       'plugin:react/recommended',
       'plugin:react-hooks/recommended',
       'plugin:jsx-a11y/recommended',
       'plugin:import/errors',
       'plugin:import/warnings',
       'prettier',
     ],
     parserOptions: {
       ecmaFeatures: {
         jsx: true,
       },
       ecmaVersion: 12,
       sourceType: 'module',
     },
     plugins: ['react', 'react-hooks', 'jsx-a11y', 'import', 'prettier'],
     rules: {
       'prettier/prettier': 'error',
       'react/prop-types': 'off',
       'react/react-in-jsx-scope': 'off',
       'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
       'import/order': [
         'error',
         {
           groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
           'newlines-between': 'always',
         },
       ],
     },
     settings: {
       react: {
         version: 'detect',
       },
     },
   };
   ```

   ```javascript
   // .prettierrc.js
   module.exports = {
     semi: true,
     trailingComma: 'es5',
     singleQuote: true,
     printWidth: 100,
     tabWidth: 2,
     endOfLine: 'auto',
   };
   ```

### 2. Unit Testing

1. **Test Chess Game Logic**
   - Write tests for game state management
   - Test move validation and execution

   ```javascript
   // src/hooks/__tests__/useChessGame.test.js
   import { renderHook, act } from '@testing-library/react-hooks';
   import { useChessGame } from '../useChessGame';

   describe('useChessGame', () => {
     it('should initialize with default state', () => {
       const { result } = renderHook(() => useChessGame());
       
       expect(result.current.game).toBeDefined();
       expect(result.current.gameOver).toBe(false);
       expect(result.current.position).toBeDefined();
       expect(result.current.turn).toBe('w');
       expect(result.current.inCheck).toBe(false);
       expect(result.current.isCheckmate).toBe(false);
       expect(result.current.isDraw).toBe(false);
     });
     
     it('should make a move when valid', () => {
       const { result } = renderHook(() => useChessGame());
       
       act(() => {
         const moveResult = result.current.makeMove({
           from: 'e2',
           to: 'e4',
         });
         
         expect(moveResult).toBe(true);
       });
       
       expect(result.current.turn).toBe('b');
     });
     
     it('should not make an invalid move', () => {
       const { result } = renderHook(() => useChessGame());
       
       act(() => {
         const moveResult = result.current.makeMove({
           from: 'e2',
           to: 'e5', // Invalid move
         });
         
         expect(moveResult).toBe(false);
       });
       
       expect(result.current.turn).toBe('w');
     });
     
     it('should reset the game', () => {
       const { result } = renderHook(() => useChessGame());
       
       act(() => {
         result.current.makeMove({
           from: 'e2',
           to: 'e4',
         });
       });
       
       expect(result.current.turn).toBe('b');
       
       act(() => {
         result.current.resetGame();
       });
       
       expect(result.current.turn).toBe('w');
       expect(result.current.gameOver).toBe(false);
     });
     
     it('should undo a move', () => {
       const { result } = renderHook(() => useChessGame());
       
       act(() => {
         result.current.makeMove({
           from: 'e2',
           to: 'e4',
         });
       });
       
       expect(result.current.turn).toBe('b');
       
       act(() => {
         result.current.undoMove();
       });
       
       expect(result.current.turn).toBe('w');
     });
   });
   ```