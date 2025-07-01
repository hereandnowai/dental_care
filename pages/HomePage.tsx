
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthForm from '../components/AuthForm';
import { UserRole } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner'; 

const HomePage: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner color="text-hnai-teal-dark" />
        <p className="text-slate-600 mt-4">Loading your session...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to={user.role === UserRole.Doctor ? '/doctor/dashboard' : '/patient/dashboard'} replace />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] bg-gradient-to-br from-hnai-gold/20 via-hnai-teal-dark/5 to-white py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-hnai-teal-dark sm:text-6xl md:text-7xl">
          Your Smile, Our Priority.
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-xl text-slate-600">
          Easily book and manage your dental appointments. Connect with your doctor anytime, anywhere.
        </p>
      </div>
      <AuthForm />
    </div>
  );
};

export default HomePage;