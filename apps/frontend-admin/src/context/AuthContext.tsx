import { createContext, useContext, useState } from 'react';
import { isAuthenticated } from '../api/client';

const AuthContext = createContext<{ isAuthenticated: boolean }>({ isAuthenticated: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth] = useState(() => isAuthenticated());
  return <AuthContext.Provider value={{ isAuthenticated: auth }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
