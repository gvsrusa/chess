# Phase 4: User Authentication Implementation

## Overview

This phase focuses on implementing user authentication for the chess web application using Supabase Auth. It includes setting up social login providers (Gmail and GitHub), creating user profiles, implementing session management, and securing routes based on authentication status.

## Objectives

- Configure Supabase Auth with social providers
- Implement user registration and login flows
- Create user profile management
- Implement secure session handling
- Set up protected routes and authentication state
- Create user statistics tracking

## Tasks

### 1. Supabase Auth Configuration

1. **Configure Auth Settings in Supabase Dashboard**
   - Enable Email/Password authentication
   - Set up site URL and redirect URLs
   - Configure password policies

2. **Set Up Social Providers**
   - Configure Google OAuth provider:
     - Create Google Cloud project
     - Set up OAuth consent screen
     - Generate OAuth credentials
     - Add credentials to Supabase

   - Configure GitHub OAuth provider:
     - Register new OAuth application in GitHub
     - Generate client ID and secret
     - Add credentials to Supabase

3. **Configure Email Templates**
   - Customize confirmation email
   - Set up password reset templates
   - Configure magic link emails

### 2. Authentication Components

1. **Create Auth Context**
   - Implement React context for authentication state
   - Provide user session throughout the application

   ```javascript
   // src/contexts/AuthContext.js
   import { createContext, useState, useEffect, useContext } from 'react';
   import { supabase } from '../services/supabaseClient';

   const AuthContext = createContext();

   export function AuthProvider({ children }) {
     const [user, setUser] = useState(null);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState(null);

     useEffect(() => {
       // Get initial session
       supabase.auth.getSession().then(({ data: { session } }) => {
         setUser(session?.user || null);
         setLoading(false);
       });

       // Listen for auth changes
       const { data: { subscription } } = supabase.auth.onAuthStateChange(
         (_event, session) => {
           setUser(session?.user || null);
           setLoading(false);
         }
       );

       return () => subscription.unsubscribe();
     }, []);

     const signIn = async (provider) => {
       setLoading(true);
       setError(null);
       
       try {
         const { error } = await supabase.auth.signInWithOAuth({
           provider,
         });
         
         if (error) throw error;
       } catch (err) {
         setError(err.message);
         setLoading(false);
       }
     };

     const signOut = async () => {
       setLoading(true);
       setError(null);
       
       try {
         const { error } = await supabase.auth.signOut();
         if (error) throw error;
       } catch (err) {
         setError(err.message);
       } finally {
         setLoading(false);
       }
     };

     return (
       <AuthContext.Provider
         value={{
           user,
           loading,
           error,
           signIn,
           signOut,
           isAuthenticated: !!user,
         }}
       >
         {children}
       </AuthContext.Provider>
     );
   }

   export function useAuth() {
     return useContext(AuthContext);
   }
   ```

2. **Create Login Component**
   - Implement social login buttons
   - Add loading states and error handling

   ```javascript
   // src/components/Auth/Login.jsx
   import React, { useState } from 'react';
   import { useAuth } from '../../contexts/AuthContext';

   function Login() {
     const { signIn, loading, error } = useAuth();
     
     const handleGoogleLogin = () => {
       signIn('google');
     };
     
     const handleGitHubLogin = () => {
       signIn('github');
     };
     
     return (
       <div className="login-container">
         <h2>Sign in to Chess App</h2>
         
         {error && (
           <div className="error-message">
             {error}
           </div>
         )}
         
         <div className="login-buttons">
           <button 
             className="login-button google"
             onClick={handleGoogleLogin}
             disabled={loading}
           >
             <img src="/images/google-icon.svg" alt="Google" />
             Sign in with Google
           </button>
           
           <button 
             className="login-button github"
             onClick={handleGitHubLogin}
             disabled={loading}
           >
             <img src="/images/github-icon.svg" alt="GitHub" />
             Sign in with GitHub
           </button>
         </div>
         
         {loading && (
           <div className="loading-indicator">
             Signing in...
           </div>
         )}
       </div>
     );
   }

   export default Login;
   ```

3. **Create Auth Layout**
   - Implement layout for authentication pages
   - Add branding and visual elements

### 3. User Profile Management

1. **Create User Profiles Table**
   - Set up database table for extended user information
   - Configure RLS policies for the table

   ```sql
   -- Create user profiles table
   CREATE TABLE user_profiles (
     id UUID PRIMARY KEY REFERENCES auth.users(id),
     username TEXT UNIQUE,
     avatar_url TEXT,
     rating INTEGER DEFAULT 1200,
     games_played INTEGER DEFAULT 0,
     games_won INTEGER DEFAULT 0,
     games_lost INTEGER DEFAULT 0,
     games_drawn INTEGER DEFAULT 0,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Set up RLS policies
   ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

   -- Everyone can read profiles
   CREATE POLICY "Profiles are viewable by everyone" ON user_profiles
     FOR SELECT USING (true);

   -- Users can update their own profiles
   CREATE POLICY "Users can update their own profiles" ON user_profiles
     FOR UPDATE USING (auth.uid() = id);

   -- Trigger to create profile on user creation
   CREATE OR REPLACE FUNCTION create_profile_for_user()
   RETURNS TRIGGER AS $$
   BEGIN
     INSERT INTO public.user_profiles (id)
     VALUES (NEW.id);
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW EXECUTE FUNCTION create_profile_for_user();
   ```

2. **Implement Profile Hook**
   - Create a hook for managing user profile data
   - Handle profile updates and retrieval

   ```javascript
   // src/hooks/useProfile.js
   import { useState, useEffect } from 'react';
   import { supabase } from '../services/supabaseClient';
   import { useAuth } from '../contexts/AuthContext';

   export function useProfile() {
     const { user } = useAuth();
     const [profile, setProfile] = useState(null);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState(null);

     useEffect(() => {
       if (user) {
         fetchProfile();
       } else {
         setProfile(null);
         setLoading(false);
       }
     }, [user]);

     const fetchProfile = async () => {
       setLoading(true);
       setError(null);
       
       try {
         const { data, error } = await supabase
           .from('user_profiles')
           .select('*')
           .eq('id', user.id)
           .single();
           
         if (error) throw error;
         
         setProfile(data);
       } catch (err) {
         setError(err.message);
       } finally {
         setLoading(false);
       }
     };

     const updateProfile = async (updates) => {
       setLoading(true);
       setError(null);
       
       try {
         const { data, error } = await supabase
           .from('user_profiles')
           .update(updates)
           .eq('id', user.id)
           .select()
           .single();
           
         if (error) throw error;
         
         setProfile(data);
         return data;
       } catch (err) {
         setError(err.message);
         return null;
       } finally {
         setLoading(false);
       }
     };

     return {
       profile,
       loading,
       error,
       updateProfile,
       refreshProfile: fetchProfile,
     };
   }
   ```

3. **Create Profile Component**
   - Implement profile view and edit functionality
   - Add avatar upload using Supabase Storage

   ```javascript
   // src/components/Auth/Profile.jsx
   import React, { useState } from 'react';
   import { useProfile } from '../../hooks/useProfile';
   import { supabase } from '../../services/supabaseClient';

   function Profile() {
     const { profile, loading, error, updateProfile } = useProfile();
     const [username, setUsername] = useState('');
     const [updating, setUpdating] = useState(false);
     const [avatarUrl, setAvatarUrl] = useState('');
     const [avatarFile, setAvatarFile] = useState(null);

     // Initialize form when profile loads
     React.useEffect(() => {
       if (profile) {
         setUsername(profile.username || '');
         setAvatarUrl(profile.avatar_url || '');
       }
     }, [profile]);

     const handleSubmit = async (e) => {
       e.preventDefault();
       setUpdating(true);
       
       try {
         // Upload avatar if selected
         let newAvatarUrl = avatarUrl;
         
         if (avatarFile) {
           const fileExt = avatarFile.name.split('.').pop();
           const fileName = `${Math.random()}.${fileExt}`;
           const filePath = `avatars/${fileName}`;
           
           const { error: uploadError } = await supabase.storage
             .from('user-content')
             .upload(filePath, avatarFile);
             
           if (uploadError) throw uploadError;
           
           newAvatarUrl = supabase.storage
             .from('user-content')
             .getPublicUrl(filePath).data.publicUrl;
         }
         
         // Update profile
         await updateProfile({
           username,
           avatar_url: newAvatarUrl,
           updated_at: new Date(),
         });
         
         alert('Profile updated successfully!');
       } catch (err) {
         alert(`Error updating profile: ${err.message}`);
       } finally {
         setUpdating(false);
       }
     };

     const handleAvatarChange = (e) => {
       if (e.target.files && e.target.files[0]) {
         const file = e.target.files[0];
         setAvatarFile(file);
         
         // Show preview
         const reader = new FileReader();
         reader.onload = (event) => {
           setAvatarUrl(event.target.result);
         };
         reader.readAsDataURL(file);
       }
     };

     if (loading) return <div>Loading profile...</div>;
     if (error) return <div>Error loading profile: {error}</div>;
     if (!profile) return <div>No profile found</div>;

     return (
       <div className="profile-container">
         <h2>Your Profile</h2>
         
         <form onSubmit={handleSubmit}>
           <div className="avatar-section">
             <div className="avatar-preview">
               {avatarUrl ? (
                 <img src={avatarUrl} alt="Avatar" />
               ) : (
                 <div className="avatar-placeholder">
                   {username ? username[0].toUpperCase() : '?'}
                 </div>
               )}
             </div>
             
             <input
               type="file"
               accept="image/*"
               onChange={handleAvatarChange}
               id="avatar-upload"
             />
             <label htmlFor="avatar-upload" className="avatar-upload-button">
               Change Avatar
             </label>
           </div>
           
           <div className="form-group">
             <label htmlFor="username">Username</label>
             <input
               type="text"
               id="username"
               value={username}
               onChange={(e) => setUsername(e.target.value)}
               required
             />
           </div>
           
           <div className="stats-section">
             <h3>Your Stats</h3>
             <div className="stats-grid">
               <div className="stat">
                 <span className="stat-label">Rating</span>
                 <span className="stat-value">{profile.rating}</span>
               </div>
               <div className="stat">
                 <span className="stat-label">Games Played</span>
                 <span className="stat-value">{profile.games_played}</span>
               </div>
               <div className="stat">
                 <span className="stat-label">Win Rate</span>
                 <span className="stat-value">
                   {profile.games_played > 0
                     ? `${Math.round((profile.games_won / profile.games_played) * 100)}%`
                     : 'N/A'}
                 </span>
               </div>
             </div>
           </div>
           
           <button
             type="submit"
             className="save-button"
             disabled={updating}
           >
             {updating ? 'Saving...' : 'Save Profile'}
           </button>
         </form>
       </div>
     );
   }

   export default Profile;
   ```

### 4. Protected Routes and Navigation

1. **Create Protected Route Component**
   - Implement route protection based on authentication
   - Handle redirects for unauthenticated users

   ```javascript
   // src/components/Auth/ProtectedRoute.jsx
   import React from 'react';
   import { Navigate, Outlet } from 'react-router-dom';
   import { useAuth } from '../../contexts/AuthContext';

   function ProtectedRoute() {
     const { isAuthenticated, loading } = useAuth();
     
     if (loading) {
       return <div>Loading...</div>;
     }
     
     return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
   }

   export default ProtectedRoute;
   ```

2. **Implement Navigation with Auth State**
   - Create navigation component with auth-aware links
   - Show/hide elements based on authentication status

   ```javascript
   // src/components/UI/Navigation.jsx
   import React from 'react';
   import { Link, useNavigate } from 'react-router-dom';
   import { useAuth } from '../../contexts/AuthContext';
   import { useProfile } from '../../hooks/useProfile';

   function Navigation() {
     const { isAuthenticated, signOut, user } = useAuth();
     const { profile } = useProfile();
     const navigate = useNavigate();
     
     const handleSignOut = async () => {
       await signOut();
       navigate('/');
     };
     
     return (
       <nav className="main-navigation">
         <div className="nav-logo">
           <Link to="/">Chess App</Link>
         </div>
         
         <ul className="nav-links">
           <li>
             <Link to="/">Home</Link>
           </li>
           <li>
             <Link to="/play/computer">Play vs Computer</Link>
           </li>
           {isAuthenticated && (
             <li>
               <Link to="/play/online">Play Online</Link>
             </li>
           )}
           <li>
             <Link to="/learn">Learn</Link>
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
                 <Link to="/profile">Profile</Link>
                 <Link to="/games">My Games</Link>
                 <button onClick={handleSignOut}>Sign Out</button>
               </div>
             </div>
           ) : (
             <Link to="/login" className="login-button">
               Sign In
             </Link>
           )}
         </div>
       </nav>
     );
   }

   export default Navigation;
   ```

3. **Set Up App Routes**
   - Configure React Router with protected routes
   - Implement route structure for the application

   ```javascript
   // src/App.jsx
   import React from 'react';
   import { BrowserRouter, Routes, Route } from 'react-router-dom';
   import { AuthProvider } from './contexts/AuthContext';
   import Layout from './components/UI/Layout';
   import Home from './pages/Home';
   import Login from './components/Auth/Login';
   import Profile from './components/Auth/Profile';
   import SinglePlayerGame from './components/Chess/SinglePlayerGame';
   import MultiplayerGame from './components/Chess/MultiplayerGame';
   import ProtectedRoute from './components/Auth/ProtectedRoute';
   import Learn from './pages/Learn';
   import NotFound from './pages/NotFound';

   function App() {
     return (
       <BrowserRouter>
         <AuthProvider>
           <Routes>
             <Route path="/" element={<Layout />}>
               <Route index element={<Home />} />
               <Route path="login" element={<Login />} />
               <Route path="play/computer" element={<SinglePlayerGame />} />
               <Route path="learn" element={<Learn />} />
               
               {/* Protected routes */}
               <Route element={<ProtectedRoute />}>
                 <Route path="profile" element={<Profile />} />
                 <Route path="play/online" element={<MultiplayerGame />} />
                 <Route path="play/online/:gameId" element={<MultiplayerGame />} />
               </Route>
               
               <Route path="*" element={<NotFound />} />
             </Route>
           </Routes>
         </AuthProvider>
       </BrowserRouter>
     );
   }

   export default App;
   ```

### 5. User Statistics and Ratings

1. **Implement Rating System**
   - Create ELO rating calculation functions
   - Set up rating updates after games

   ```javascript
   // src/utils/ratingCalculator.js
   export function calculateNewRating(playerRating, opponentRating, result) {
     // K-factor determines the maximum change in rating
     const kFactor = 32;
     
     // Expected score based on ELO formula
     const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
     
     // Actual score: 1 for win, 0.5 for draw, 0 for loss
     const actualScore = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
     
     // Calculate new rating
     const newRating = Math.round(playerRating + kFactor * (actualScore - expectedScore));
     
     return newRating;
   }
   ```

2. **Create Statistics Service**
   - Implement functions for updating user statistics
   - Create leaderboard queries

   ```javascript
   // src/services/statisticsService.js
   import { supabase } from './supabaseClient';
   import { calculateNewRating } from '../utils/ratingCalculator';

   export async function updateUserStats(userId, gameResult, opponentRating) {
     try {
       // Get current user profile
       const { data: profile, error: profileError } = await supabase
         .from('user_profiles')
         .select('*')
         .eq('id', userId)
         .single();
         
       if (profileError) throw profileError;
       
       // Calculate new stats
       const gamesPlayed = profile.games_played + 1;
       const gamesWon = gameResult === 'win' ? profile.games_won + 1 : profile.games_won;
       const gamesLost = gameResult === 'loss' ? profile.games_lost + 1 : profile.games_lost;
       const gamesDrawn = gameResult === 'draw' ? profile.games_drawn + 1 : profile.games_drawn;
       
       // Calculate new rating
       const newRating = calculateNewRating(
         profile.rating,
         opponentRating,
         gameResult
       );
       
       // Update profile
       const { error: updateError } = await supabase
         .from('user_profiles')
         .update({
           games_played: gamesPlayed,
           games_won: gamesWon,
           games_lost: gamesLost,
           games_drawn: gamesDrawn,
           rating: newRating,
           updated_at: new Date(),
         })
         .eq('id', userId);
         
       if (updateError) throw updateError;
       
       return {
         oldRating: profile.rating,
         newRating,
         ratingChange: newRating - profile.rating,
       };
     } catch (error) {
       console.error('Error updating user stats:', error);
       throw error;
     }
   }

   export async function getLeaderboard(limit = 10) {
     try {
       const { data, error } = await supabase
         .from('user_profiles')
         .select('id, username, rating, games_played, games_won, games_lost, games_drawn')
         .order('rating', { ascending: false })
         .limit(limit);
         
       if (error) throw error;
       
       return data;
     } catch (error) {
       console.error('Error fetching leaderboard:', error);
       throw error;
     }
   }
   ```

3. **Create Leaderboard Component**
   - Implement leaderboard display
   - Add user ranking information

### 6. Authentication Flow Testing

1. **Test Social Login Flows**
   - Verify Google authentication
   - Test GitHub authentication
   - Ensure proper redirect handling

2. **Test Session Management**
   - Verify session persistence
   - Test session expiration handling
   - Ensure proper logout functionality

3. **Test Protected Routes**
   - Verify unauthenticated users are redirected
   - Ensure authenticated users can access protected routes

## Deliverables

- Fully configured Supabase Auth with social providers
- Implemented user registration and login flows
- User profile management functionality
- Secure session handling and protected routes
- User statistics and rating system
- Leaderboard functionality

## Dependencies

- Completed Project Setup phase
- Supabase project with Auth configuration
- OAuth credentials for social providers

## Timeline

- **Estimated Duration**: 2 weeks
- **Effort**: 80 person-hours

## Success Criteria

- Users can sign in using Gmail and GitHub
- User profiles can be created and updated
- Authentication state is properly maintained across sessions
- Protected routes are only accessible to authenticated users
- User statistics are properly tracked and updated
- Leaderboard displays user rankings correctly

## Next Steps

After completing this phase, proceed to [Phase 5: Multiplayer Functionality](05_multiplayer_functionality.md) or [Phase 6: UI/UX Development](06_ui_ux_development.md) which can be implemented in parallel.