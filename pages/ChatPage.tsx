
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatInterface from '../components/ChatInterface';
import { useAuth } from '../contexts/AuthContext';
import * as Api from '../services/api';
import { User } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const ChatPage: React.FC = () => {
  const { contactId } = useParams<{ contactId: string }>();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [contactUser, setContactUser] = useState<User | null>(null);
  const [loadingContact, setLoadingContact] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return; // Wait for auth state to be resolved

    if (!currentUser) {
      navigate('/'); // Should be handled by ProtectedRoute, but as a safeguard
      return;
    }
    
    if (contactId) {
      setLoadingContact(true);
      Api.getUserById(contactId)
        .then(user => {
          if (user) {
            setContactUser(user);
          } else {
            // Handle user not found, maybe navigate back or show error
            navigate(currentUser.role === 'DOCTOR' ? '/doctor/dashboard' : '/patient/dashboard');
          }
        })
        .catch(console.error)
        .finally(() => setLoadingContact(false));
    } else {
        // No contactId, navigate to dashboard
        navigate(currentUser.role === 'DOCTOR' ? '/doctor/dashboard' : '/patient/dashboard');
    }
  }, [contactId, currentUser, authLoading, navigate]);

  if (authLoading || loadingContact) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner /> <span className="ml-2 text-slate-500">Loading chat...</span></div>;
  }

  if (!contactUser) {
    // This case should ideally be handled by navigation above, but good for robustness
    return <div className="text-center p-8 text-slate-600">Could not load contact information.</div>;
  }
  
  return (
    <div>
      {/* Optionally, add a back button or breadcrumbs here */}
      <ChatInterface contactUser={contactUser} />
    </div>
  );
};

export default ChatPage;
