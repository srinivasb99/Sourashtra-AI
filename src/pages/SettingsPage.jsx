import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Calendar, Shield, Key, Trash2, AlertTriangle, Check, Eye, EyeOff, Camera, Upload } from 'lucide-react';
import './SettingsPage.css';

function SettingsPage() {
  const { user, isGoogleUser, changePassword, deleteAccount, updateProfilePhoto } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // State for profile photo
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [photoSuccess, setPhotoSuccess] = useState('');
  
  // State for password change
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  // State for account deletion
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/signin');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const isGoogle = isGoogleUser();

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle profile photo change
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image must be less than 5MB');
      return;
    }

    setPhotoLoading(true);
    setPhotoError('');
    setPhotoSuccess('');

    try {
      await updateProfilePhoto(file);
      setPhotoSuccess('Profile photo updated!');
      setTimeout(() => setPhotoSuccess(''), 3000);
    } catch (error) {
      setPhotoError('Failed to update photo. Please try again.');
    } finally {
      setPhotoLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (error) {
      setPasswordError(getErrorMessage(error.code));
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    setDeleteError('');

    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm');
      return;
    }

    if (!isGoogle && !deletePassword) {
      setDeleteError('Please enter your password');
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteAccount(isGoogle ? null : deletePassword);
      navigate('/');
    } catch (error) {
      setDeleteError(getErrorMessage(error.code));
    } finally {
      setDeleteLoading(false);
    }
  };

  const getErrorMessage = (code) => {
    switch (code) {
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect password';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later';
      case 'auth/requires-recent-login':
        return 'Please sign out and sign in again to perform this action';
      case 'auth/weak-password':
        return 'Password is too weak. Use at least 6 characters';
      default:
        return 'An error occurred. Please try again';
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h1>Account Settings</h1>
          <p>Manage your account details and preferences</p>
        </div>

        {/* Account Information */}
        <section className="settings-section">
          <div className="section-header">
            <User size={20} />
            <h2>Account Information</h2>
          </div>
          
          <div className="account-info-card">
            <div className="user-profile-large">
              <div className="profile-photo-container">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="profile-avatar-large"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="profile-avatar-initials-large">
                    {user.displayName?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <button 
                  className="photo-edit-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoLoading}
                  title="Change profile photo"
                >
                  {photoLoading ? (
                    <Upload size={16} className="spinning" />
                  ) : (
                    <Camera size={16} />
                  )}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>
              {photoSuccess && (
                <div className="photo-success-toast">
                  <Check size={14} />
                  {photoSuccess}
                </div>
              )}
              {photoError && (
                <div className="photo-error-toast">
                  <AlertTriangle size={14} />
                  {photoError}
                </div>
              )}
            </div>
            
            <div className="account-details">
              <div className="detail-item">
                <div className="detail-icon">
                  <User size={18} />
                </div>
                <div className="detail-content">
                  <span className="detail-label">Display Name</span>
                  <span className="detail-value">{user.displayName || 'Not set'}</span>
                </div>
              </div>
              
              <div className="detail-item">
                <div className="detail-icon">
                  <Mail size={18} />
                </div>
                <div className="detail-content">
                  <span className="detail-label">Email Address</span>
                  <span className="detail-value">{user.email}</span>
                </div>
              </div>
              
              <div className="detail-item">
                <div className="detail-icon">
                  <Shield size={18} />
                </div>
                <div className="detail-content">
                  <span className="detail-label">Sign-in Method</span>
                  <span className="detail-value">
                    {isGoogle ? (
                      <span className="provider-badge google">
                        <svg viewBox="0 0 24 24" className="provider-icon">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Google Account
                      </span>
                    ) : (
                      <span className="provider-badge email">
                        <Mail size={14} />
                        Email & Password
                      </span>
                    )}
                  </span>
                </div>
              </div>
              
              {user.createdAt && (
                <div className="detail-item">
                  <div className="detail-icon">
                    <Calendar size={18} />
                  </div>
                  <div className="detail-content">
                    <span className="detail-label">Member Since</span>
                    <span className="detail-value">{formatDate(user.createdAt)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Security Section - Only show password change for non-Google users */}
        {!isGoogle && (
          <section className="settings-section">
            <div className="section-header">
              <Key size={20} />
              <h2>Security</h2>
            </div>

            {passwordSuccess && (
              <div className="settings-success-message">
                <Check size={18} />
                {passwordSuccess}
              </div>
            )}

            {!showPasswordSection ? (
              <button 
                className="settings-action-btn"
                onClick={() => setShowPasswordSection(true)}
              >
                <Key size={18} />
                Change Password
              </button>
            ) : (
              <form onSubmit={handlePasswordChange} className="password-form">
                {passwordError && (
                  <div className="settings-error-message">
                    <AlertTriangle size={18} />
                    {passwordError}
                  </div>
                )}
                
                <div className="settings-form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      id="currentPassword"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      required
                      disabled={passwordLoading}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                <div className="settings-form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 characters)"
                      required
                      disabled={passwordLoading}
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                <div className="settings-form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    disabled={passwordLoading}
                  />
                </div>
                
                <div className="settings-form-actions">
                  <button 
                    type="button" 
                    className="settings-btn-cancel"
                    onClick={() => {
                      setShowPasswordSection(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setPasswordError('');
                    }}
                    disabled={passwordLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="settings-btn-primary"
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        {/* Danger Zone */}
        <section className="settings-section danger-zone">
          <div className="section-header">
            <Trash2 size={20} />
            <h2>Danger Zone</h2>
          </div>
          
          <div className="danger-content">
            <div className="danger-info">
              <h3>Delete Account</h3>
              <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
            </div>
            <button 
              className="settings-btn-danger"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 size={18} />
              Delete Account
            </button>
          </div>
        </section>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="settings-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="settings-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-header danger">
              <AlertTriangle size={24} />
              <h2>Delete Account</h2>
            </div>
            
            <div className="settings-modal-body">
              <p className="warning-text">
                This will permanently delete your account and all your data. This action <strong>cannot be undone</strong>.
              </p>
              
              {deleteError && (
                <div className="settings-error-message">
                  <AlertTriangle size={18} />
                  {deleteError}
                </div>
              )}
              
              {!isGoogle && (
                <div className="settings-form-group">
                  <label htmlFor="deletePassword">Enter your password to confirm</label>
                  <input
                    type="password"
                    id="deletePassword"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Your password"
                    disabled={deleteLoading}
                  />
                </div>
              )}
              
              <div className="settings-form-group">
                <label htmlFor="deleteConfirm">Type <strong>DELETE</strong> to confirm</label>
                <input
                  type="text"
                  id="deleteConfirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  disabled={deleteLoading}
                />
              </div>
            </div>
            
            <div className="settings-modal-actions">
              <button 
                className="settings-btn-cancel"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                  setDeleteConfirmText('');
                  setDeleteError('');
                }}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button 
                className="settings-btn-danger"
                onClick={handleDeleteAccount}
                disabled={deleteLoading || deleteConfirmText !== 'DELETE'}
              >
                {deleteLoading ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
