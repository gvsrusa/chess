import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          await fetchProfile(user.id);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setProfile(data);
        setUsername(data.username || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          username,
          updated_at: new Date()
        });

      if (error) {
        throw error;
      }

      // Refresh profile data
      await fetchProfile(user.id);
    } catch (error) {
      setError(error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in to view your profile.</div>;
  }

  return (
    <div className="profile-container">
      <h2>User Profile</h2>
      {error && <div className="error-message">{error}</div>}
      
      <div className="user-info">
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>User ID:</strong> {user.id}</p>
        {profile && (
          <>
            <p><strong>Rating:</strong> {profile.rating}</p>
            <p><strong>Games Played:</strong> {profile.games_played}</p>
            <p><strong>Win/Loss/Draw:</strong> {profile.games_won}/{profile.games_lost}/{profile.games_drawn}</p>
            <p><strong>Member since:</strong> {new Date(profile.created_at).toLocaleDateString()}</p>
          </>
        )}
      </div>
      
      <form onSubmit={updateProfile} className="profile-form">
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
        
        <button 
          type="submit" 
          className="update-button" 
          disabled={updating}
        >
          {updating ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
      
      <button onClick={handleSignOut} className="sign-out-button">
        Sign Out
      </button>
    </div>
  );
};

export default Profile;