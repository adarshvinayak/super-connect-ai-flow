
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface AuthProtectedProps {
  children: ReactNode;
}

const AuthProtected = ({ children }: AuthProtectedProps) => {
  // This is a placeholder for the actual authentication logic
  // that will be implemented with Supabase later
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-supernet-purple mb-4"></div>
          <div className="text-supernet-grey">Loading...</div>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

export default AuthProtected;
