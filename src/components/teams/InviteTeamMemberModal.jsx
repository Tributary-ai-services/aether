import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Modal from '../ui/Modal.jsx';
import { 
  UserPlus, 
  Mail, 
  Shield, 
  Users,
  Eye,
  Send,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import {
  inviteTeamMember,
  selectInvitationLoading,
  selectInvitationError,
  clearInvitationError
} from '../../store/slices/teamsSlice.js';

const InviteTeamMemberModal = ({ isOpen, onClose, team }) => {
  const dispatch = useDispatch();
  const loading = useSelector(selectInvitationLoading);
  const error = useSelector(selectInvitationError);
  
  const [formData, setFormData] = useState({
    email: '',
    role: 'member',
    message: ''
  });
  
  const [validationError, setValidationError] = useState('');
  const [inviteSent, setInviteSent] = useState(false);

  const roleOptions = [
    {
      value: 'admin',
      label: 'Admin',
      description: 'Can manage team settings and members',
      icon: Shield,
      color: 'text-(--color-primary-600)'
    },
    {
      value: 'member',
      label: 'Member',
      description: 'Can create and edit team notebooks',
      icon: Users,
      color: 'text-green-600'
    },
    {
      value: 'viewer',
      label: 'Viewer',
      description: 'Can only view team notebooks',
      icon: Eye,
      color: 'text-gray-600'
    }
  ];

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      setValidationError('Email is required');
      return;
    }
    
    if (!validateEmail(formData.email)) {
      setValidationError('Please enter a valid email address');
      return;
    }
    
    setValidationError('');
    
    try {
      await dispatch(inviteTeamMember({
        teamId: team.id,
        email: formData.email.trim(),
        role: formData.role
      })).unwrap();
      
      setInviteSent(true);
      
      // Reset form after 2 seconds and close
      setTimeout(() => {
        setFormData({ email: '', role: 'member', message: '' });
        setInviteSent(false);
        onClose();
      }, 2000);
      
    } catch (err) {
      console.error('Failed to send invitation:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors
    if (name === 'email') {
      setValidationError('');
      if (error) {
        dispatch(clearInvitationError());
      }
    }
  };

  const handleClose = () => {
    setFormData({ email: '', role: 'member', message: '' });
    setValidationError('');
    setInviteSent(false);
    if (error) {
      dispatch(clearInvitationError());
    }
    onClose();
  };

  if (!team) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title={`Invite to ${team.name}`}
      size="md"
    >
      {inviteSent ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Invitation Sent!
          </h3>
          <p className="text-gray-600">
            We've sent an invitation to <span className="font-medium">{formData.email}</span>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error messages */}
          {(error || validationError) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle size={20} />
                <p className="text-sm">{validationError || error}</p>
              </div>
            </div>
          )}

          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-primary-500)"
                placeholder="colleague@example.com"
                disabled={loading}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              They'll receive an email invitation to join your team
            </p>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Role
            </label>
            <div className="space-y-2">
              {roleOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <label
                    key={option.value}
                    className={`relative flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.role === option.value
                        ? 'border-(--color-primary-500) bg-(--color-primary-50)'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={option.value}
                      checked={formData.role === option.value}
                      onChange={handleInputChange}
                      className="sr-only"
                      disabled={loading}
                    />
                    <div className="flex items-start gap-3">
                      <Icon size={20} className={option.color} />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {option.label}
                        </div>
                        <div className="text-sm text-gray-600">
                          {option.description}
                        </div>
                      </div>
                    </div>
                    {formData.role === option.value && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-(--color-primary-600) rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Personal Message (Optional) */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Personal Message <span className="text-gray-500">(Optional)</span>
            </label>
            <textarea
              id="message"
              name="message"
              rows={3}
              value={formData.message}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-primary-500) resize-none"
              placeholder="Add a personal note to your invitation..."
              disabled={loading}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.email}
              className="flex items-center gap-2 px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send Invitation
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default InviteTeamMemberModal;