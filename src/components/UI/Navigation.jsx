import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';

const Navigation = () => {
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Fetch the current user
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    fetchUser();

    // Listen for authentication changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      // Clean up the subscription
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  return (
    <nav className="app-navigation">
      <div className="app-logo">
        <Link to="/">Chess Web App</Link>
      </div>
      
      <ul className="nav-links">
        <li className={location.pathname === '/' ? 'active' : ''}>
          <Link to="/">Home</Link>
        </li>
        
        <li className={location.pathname === '/play' ? 'active' : ''}>
          <Link to="/play">Single Player</Link>
        </li>
        
        <li className={location.pathname === '/lobby' ? 'active' : ''}>
          <Link to="/lobby">Multiplayer</Link>
        </li>
        
        {user ? (
          <>
            <li className={location.pathname === '/profile' ? 'active' : ''}>
              <Link to="/profile">Profile</Link>
            </li>
            <li>
              <button
                onClick={() => supabase.auth.signOut()}
                className="nav-button sign-out"
              >
                Sign Out
              </button>
            </li>
          </>
        ) : (
          <li className={location.pathname === '/login' ? 'active' : ''}>
            <Link to="/login">Login</Link>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Navigation;