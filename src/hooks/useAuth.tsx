
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {}
});

// Placeholder auth provider (to be replaced with Supabase)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // For demo purposes - simulate auth
  useEffect(() => {
    // Check localStorage for demo auth state
    const storedUser = localStorage.getItem('demoUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);
  
  const signIn = async (email: string, password: string) => {
    // Demo sign in - will be replaced with Supabase auth
    const demoUser = { id: '1', email };
    setUser(demoUser);
    localStorage.setItem('demoUser', JSON.stringify(demoUser));
  };
  
  const signUp = async (email: string, password: string) => {
    // Demo sign up - will be replaced with Supabase auth
    const demoUser = { id: '1', email };
    setUser(demoUser);
    localStorage.setItem('demoUser', JSON.stringify(demoUser));
  };
  
  const signOut = async () => {
    // Demo sign out - will be replaced with Supabase auth
    setUser(null);
    localStorage.removeItem('demoUser');
  };
  
  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      signIn,
      signUp,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook for using auth
export function useAuth() {
  return useContext(AuthContext);
}
