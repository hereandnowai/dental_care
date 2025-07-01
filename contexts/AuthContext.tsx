
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../types';
import * as Api from '../services/api'; // Assuming api.ts exports getCurrentUser

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password_DO_NOT_USE: string) => Promise<User | null>; // Password arg for interface, not actual use here for mock
  signup: (name: string, email: string, password_DO_NOT_USE: string, role: User['role'], specialty?: string) => Promise<User | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserSession = async () => {
      setLoading(true);
      const currentUser = await Api.getCurrentUser(); // Fetches from localStorage
      setUser(currentUser);
      setLoading(false);
    };
    checkUserSession();
  }, []);

  const login = async (email: string, password_DO_NOT_USE: string): Promise<User | null> => {
    setLoading(true);
    const loggedInUser = await Api.loginUser(email, password_DO_NOT_USE); // api.loginUser handles mock validation
    setUser(loggedInUser);
    setLoading(false);
    return loggedInUser;
  };

  const signup = async (name: string, email: string, password_DO_NOT_USE: string, role: User['role'], specialty?: string): Promise<User | null> => {
    setLoading(true);
    const newUser = await Api.signupUser(name, email, password_DO_NOT_USE, role, specialty);
    setUser(newUser); // Optionally auto-login after signup
    setLoading(false);
    return newUser;
  };

  const logout = async () => {
    setLoading(true);
    await Api.logoutUser();
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
