
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { UserRole } from '../types'; 
import { DOCTOR_SPECIALTIES } from '../constants';
import Input from './ui/Input';
import Button from './ui/Button';
import Select from './ui/Select';
import UserIcon from './icons/UserIcon';
import LockClosedIcon from './icons/LockClosedIcon';
import EnvelopeIcon from './icons/EnvelopeIcon';
import IdentificationIcon from './icons/IdentificationIcon';


interface AuthFormProps {
  isSignUpMode?: boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({ isSignUpMode = false }) => {
  const [isSignUp, setIsSignUp] = useState(isSignUpMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.Patient);
  const [specialty, setSpecialty] = useState(DOCTOR_SPECIALTIES[0]); 
  const [loading, setLoading] = useState(false);
  
  const { login, signup } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let user;
      if (isSignUp) {
        if (role === UserRole.Doctor && !specialty) {
            addNotification('Please select a specialty for doctor role.', 'error');
            setLoading(false);
            return;
        }
        user = await signup(name, email, password, role, role === UserRole.Doctor ? specialty : undefined);
        if (user) addNotification('Sign up successful! Welcome!', 'success');
      } else {
        user = await login(email, password);
        if (user) addNotification('Login successful! Welcome back!', 'success');
      }

      if (user) {
        navigate(user.role === UserRole.Doctor ? '/doctor/dashboard' : '/patient/dashboard');
      } else {
        addNotification(isSignUp ? 'Sign up failed. Please try again.' : 'Login failed. Please check your credentials.', 'error');
      }
    } catch (error: any) {
      addNotification(error.message || 'An unexpected error occurred.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const specialtyOptions = DOCTOR_SPECIALTIES.map(s => ({ value: s, label: s }));

  return (
    <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-xl">
      <h2 className="text-3xl font-bold text-center text-hnai-teal-dark mb-8">
        {isSignUp ? 'Create Account' : 'Welcome Back!'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {isSignUp && (
          <Input
            label="Full Name"
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            Icon={UserIcon}
            placeholder="John Doe"
          />
        )}
        <Input
          label="Email Address"
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          Icon={EnvelopeIcon}
          placeholder="you@example.com"
        />
        <Input
          label="Password"
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          Icon={LockClosedIcon}
          placeholder="••••••••"
        />
        {isSignUp && (
          <>
            <Select
              label="I am a..."
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              options={[
                { value: UserRole.Patient, label: 'Patient' },
                { value: UserRole.Doctor, label: 'Doctor' },
              ]}
              required
            />
            {role === UserRole.Doctor && (
              <Select
                label="Specialty"
                id="specialty"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                options={specialtyOptions}
                required
              />
            )}
          </>
        )}
        <Button type="submit" isLoading={loading} className="w-full">
          {isSignUp ? 'Sign Up' : 'Login'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="font-medium text-hnai-teal-dark hover:text-hnai-teal-hover"
        >
          {isSignUp ? 'Login here' : 'Sign up now'}
        </button>
      </p>
    </div>
  );
};

export default AuthForm;