import React from 'react';
import Navigation from './Navigation';

const Layout = ({ children }) => {
  return (
    <div className="app-layout">
      <header>
        <Navigation />
      </header>
      
      <main className="main-content">
        {children}
      </main>
      
      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} Chess Web App</p>
      </footer>
    </div>
  );
};

export default Layout;