
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { UserRole } from './types';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import PatientDashboardPage from './pages/PatientDashboardPage';
import DoctorDashboardPage from './pages/DoctorDashboardPage';
import ChatPage from './pages/ChatPage';
import AppointmentsPage from './pages/AppointmentsPage'; // For managing/viewing appointments
import BookingPage from './pages/BookingPage'; // For patients to book
import AvailabilityPage from './pages/AvailabilityPage'; // For doctors to set availability
import { NotificationToasts } from './contexts/NotificationContext';
import { HNAI_NAME_SHORT, HNAI_WEBSITE, HNAI_EMAIL, HNAI_MOBILE, HNAI_SOCIAL_LINKS } from './constants';

// Social Media Icons (Simple SVGs) - Consider moving to separate files if they grow complex
const BlogIcon = () => <svg fill="currentColor" viewBox="0 0 20 20" className="w-5 h-5"><path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0L10 9.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>;
const LinkedInIcon = () => <svg fill="currentColor" viewBox="0 0 20 20" className="w-5 h-5"><path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014V8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.368 7.177a1.569 1.569 0 01-1.568-1.57A1.57 1.57 0 015.368 4.04a1.57 1.57 0 011.568 1.568A1.57 1.57 0 015.368 7.177zM6.623 16.338H4.112V8.59H6.623v7.748zM17.662 2H2.328A2.338 2.338 0 000 4.336V15.66A2.338 2.338 0 002.328 18h15.334A2.338 2.338 0 0020 15.66V4.336A2.338 2.338 0 0017.662 2z"></path></svg>;
const InstagramIcon = () => <svg fill="currentColor" viewBox="0 0 20 20" className="w-5 h-5"><path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM5.93 5.93a.75.75 0 111.06-1.06L10 8.94l3.01-3.07a.75.75 0 111.06 1.06L11.06 10l3.01 3.01a.75.75 0 11-1.06 1.06L10 11.06l-3.01 3.01a.75.75 0 11-1.06-1.06L8.94 10 5.93 6.99zM10 5a5 5 0 100 10 5 5 0 000-10zm0 1.5a3.5 3.5 0 110 7 3.5 3.5 0 010-7zM13.75 6.25a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0z" clipRule="evenodd"></path></svg>;
const GithubIcon = () => <svg fill="currentColor" viewBox="0 0 20 20" className="w-5 h-5"><path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.031-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 5.094c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.026 2.747-1.026.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.308.678.92.678 1.852 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0020 10c0-5.523-4.477-10-10-10z" clipRule="evenodd"></path></svg>;
const XIcon = () => <svg fill="currentColor" viewBox="0 0 20 20" className="w-5 h-5"><path d="M12.937 2.25H16.5L11.56 7.915 17.5 14.75H10.38L6.875 10.09L2.5 14.75H2L7.22 8.65L1.5 2.25H8.832L12.025 6.54L12.937 2.25ZM13.562 13.062H14.75L5.22 3.812H4L13.562 13.062Z"></path></svg>;
const YouTubeIcon = () => <svg fill="currentColor" viewBox="0 0 20 20" className="w-5 h-5"><path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM8.5 7.5L12.5 10L8.5 12.5V7.5z" clipRule="evenodd"></path></svg>;


const ProtectedRoute: React.FC<{ children: React.ReactNode; role?: UserRole }> = ({ children, role }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  if (role && user.role !== role) {
    // If a specific role is required and user doesn't match, redirect to their default dashboard or home
    return <Navigate to={user.role === UserRole.Doctor ? "/doctor/dashboard" : "/patient/dashboard"} replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const { user } = useAuth();

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <NotificationToasts />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            
            {/* Patient Routes */}
            <Route path="/patient/dashboard" element={<ProtectedRoute role={UserRole.Patient}><PatientDashboardPage /></ProtectedRoute>} />
            <Route path="/patient/book-appointment" element={<ProtectedRoute role={UserRole.Patient}><BookingPage /></ProtectedRoute>} />
            <Route path="/patient/appointments" element={<ProtectedRoute role={UserRole.Patient}><AppointmentsPage /></ProtectedRoute>} />
            <Route path="/patient/chat/:contactId" element={<ProtectedRoute role={UserRole.Patient}><ChatPage /></ProtectedRoute>} />

            {/* Doctor Routes */}
            <Route path="/doctor/dashboard" element={<ProtectedRoute role={UserRole.Doctor}><DoctorDashboardPage /></ProtectedRoute>} />
            <Route path="/doctor/availability" element={<ProtectedRoute role={UserRole.Doctor}><AvailabilityPage /></ProtectedRoute>} />
            <Route path="/doctor/appointments" element={<ProtectedRoute role={UserRole.Doctor}><AppointmentsPage /></ProtectedRoute>} />
            <Route path="/doctor/chat/:contactId" element={<ProtectedRoute role={UserRole.Doctor}><ChatPage /></ProtectedRoute>} />
            
            {/* Fallback for logged-in users trying to access base path */}
            {user && <Route path="/" element={<Navigate to={user.role === UserRole.Doctor ? "/doctor/dashboard" : "/patient/dashboard"} replace />} />}
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <footer className="bg-hnai-teal-dark text-white text-center p-6 mt-auto">
            <p className="text-lg font-semibold">Dental Care Connect</p>
            <p className="text-sm text-hnai-gold mt-1">Powered by {HNAI_NAME_SHORT}</p>
            <div className="mt-3 text-xs text-slate-300 space-y-1 md:space-y-0 md:space-x-4 md:flex md:justify-center">
                <a href={HNAI_WEBSITE} target="_blank" rel="noopener noreferrer" className="hover:text-hnai-gold">Website: {HNAI_WEBSITE}</a>
                <span className="hidden md:inline">|</span>
                <a href={`mailto:${HNAI_EMAIL}`} className="hover:text-hnai-gold">Email: {HNAI_EMAIL}</a>
                <span className="hidden md:inline">|</span>
                <a href={`tel:${HNAI_MOBILE.replace(/\s/g, '')}`} className="hover:text-hnai-gold">Mobile: {HNAI_MOBILE}</a>
            </div>
            <div className="mt-4 flex justify-center space-x-4">
              <a href={HNAI_SOCIAL_LINKS.blog} target="_blank" rel="noopener noreferrer" aria-label="Blog" className="text-slate-300 hover:text-hnai-gold"><BlogIcon /></a>
              <a href={HNAI_SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-slate-300 hover:text-hnai-gold"><LinkedInIcon /></a>
              <a href={HNAI_SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-slate-300 hover:text-hnai-gold"><InstagramIcon /></a>
              <a href={HNAI_SOCIAL_LINKS.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-slate-300 hover:text-hnai-gold"><GithubIcon /></a>
              <a href={HNAI_SOCIAL_LINKS.x} target="_blank" rel="noopener noreferrer" aria-label="X" className="text-slate-300 hover:text-hnai-gold"><XIcon /></a>
              <a href={HNAI_SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-slate-300 hover:text-hnai-gold"><YouTubeIcon /></a>
            </div>
            <p className="text-xs text-slate-400 mt-4">© {new Date().getFullYear()} {HNAI_NAME_SHORT}. All rights reserved.</p>
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;