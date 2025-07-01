
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { LOGO_URL, APP_NAME } from '../constants';
import Button from './ui/Button';

const Navbar: React.FC = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <img src={LOGO_URL} alt={`${APP_NAME} Logo`} className="h-10 md:h-12" />
          <span className="text-xl md:text-2xl font-bold text-hnai-teal-dark hidden sm:block">{APP_NAME}</span>
        </Link>

        <div className="flex items-center space-x-3">
          {loading ? (
            <div className="text-sm text-slate-500">Loading...</div>
          ) : user ? (
            <>
              <span className="text-sm text-slate-700 hidden md:block">Welcome, {user.name}!</span>
              {user.role === UserRole.Patient && (
                <>
                  <Link to="/patient/dashboard" className="text-hnai-teal-dark hover:text-hnai-teal-hover px-3 py-2 rounded-md text-sm font-medium">Dashboard</Link>
                  <Link to="/patient/book-appointment" className="text-hnai-teal-dark hover:text-hnai-teal-hover px-3 py-2 rounded-md text-sm font-medium">Book</Link>
                  <Link to="/patient/appointments" className="text-hnai-teal-dark hover:text-hnai-teal-hover px-3 py-2 rounded-md text-sm font-medium">My Appointments</Link>
                </>
              )}
              {user.role === UserRole.Doctor && (
                <>
                  <Link to="/doctor/dashboard" className="text-hnai-teal-dark hover:text-hnai-teal-hover px-3 py-2 rounded-md text-sm font-medium">Dashboard</Link>
                  <Link to="/doctor/availability" className="text-hnai-teal-dark hover:text-hnai-teal-hover px-3 py-2 rounded-md text-sm font-medium">Availability</Link>
                  <Link to="/doctor/appointments" className="text-hnai-teal-dark hover:text-hnai-teal-hover px-3 py-2 rounded-md text-sm font-medium">Appointments</Link>
                </>
              )}
              <Button onClick={handleLogout} variant="secondary" size="sm">
                Logout
              </Button>
            </>
          ) : (
            <>
              {/* Login/Signup buttons could be here if not primarily on HomePage */}
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;