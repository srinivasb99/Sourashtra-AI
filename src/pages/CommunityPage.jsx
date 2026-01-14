import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Users, Calendar, Mail, Crown } from 'lucide-react';
import './CommunityPage.css';

function CommunityPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Query all users, ordered by creation date (newest first)
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const usersList = [];
        querySnapshot.forEach((doc) => {
          usersList.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        // Sort users: creator first, then by creation date
        const creatorEmail = 'srinibaj10@gmail.com';
        usersList.sort((a, b) => {
          const aIsCreator = a.email === creatorEmail;
          const bIsCreator = b.email === creatorEmail;
          if (aIsCreator && !bIsCreator) return -1;
          if (!aIsCreator && bIsCreator) return 1;
          return 0;
        });
        
        setUsers(usersList);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load community members. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const getUserInitials = (displayName) => {
    if (!displayName) return 'U';
    const names = displayName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  const isCreator = (user) => {
    return user.email === 'srinibaj10@gmail.com';
  };

  if (loading) {
    return (
      <div className="community-page">
        <div className="community-container">
          <div className="community-loading">
            <div className="loading-spinner"></div>
            <p>Loading community members...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="community-page">
        <div className="community-container">
          <div className="community-error">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="community-page">
      <div className="community-container">
        <div className="community-header">
          <div className="header-icon">
            <Users size={32} />
          </div>
          <h1>Community</h1>
          <p>Meet all the members of the Sourashtra AI community</p>
          <div className="member-count">
            <Users size={18} />
            <span>{users.length} {users.length === 1 ? 'member' : 'members'}</span>
          </div>
        </div>

        {users.length === 0 ? (
          <div className="community-empty">
            <Users size={48} />
            <p>No community members yet</p>
            <p className="empty-subtitle">Be the first to join!</p>
          </div>
        ) : (
          <div className="users-grid">
            {users.map((user) => {
              const creator = isCreator(user);
              return (
                <div key={user.id} className={`user-card ${creator ? 'creator-card' : ''}`}>
                  {creator && (
                    <div className="creator-badge">
                      <Crown size={12} />
                      <span>Creator</span>
                    </div>
                  )}
                  <div className="user-avatar-container">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || 'User'} 
                        className={`user-avatar ${creator ? 'creator-avatar' : ''}`}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className={`user-avatar-initials ${creator ? 'creator-avatar' : ''}`}>
                        {getUserInitials(user.displayName)}
                      </div>
                    )}
                  </div>
                  <div className="user-info">
                    <h3 className="user-name">{user.displayName || 'User'}</h3>
                    {user.email && (
                      <div className="user-detail">
                        <Mail size={14} />
                        <span className="user-email">{user.email}</span>
                      </div>
                    )}
                    {user.createdAt && (
                      <div className="user-detail">
                        <Calendar size={14} />
                        <span>Joined {formatDate(user.createdAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default CommunityPage;
