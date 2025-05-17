import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Toaster } from "@/components/ui/toaster"
import Navbar from './components/navigation/Navbar';
import Sidebar from './components/navigation/Sidebar';
import DashboardPage from './pages/DashboardPage';
import SearchPage from './pages/SearchPage';
import ConnectionsPage from './pages/ConnectionsPage';
import MessagingPage from './pages/MessagingPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import ViewProfilePage from './pages/ViewProfilePage';
import OnboardingPage from './pages/OnboardingPage';
import GlobalSearch from "@/components/GlobalSearch";
import { NotificationsPopover } from "@/components/ui/notifications";

function App() {
  const AuthRoutes = () => {
    const { isAuthenticated, isLoading } = useAuth();
  
    if (isLoading) {
      return <div>Loading...</div>; // Show a loading indicator while checking auth state
    }
  
    return (
      
        
          <Navbar />
          
            <Sidebar />
            
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/connections" element={<ConnectionsPage />} />
                <Route path="/messaging/:id?" element={<MessagingPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/:id" element={<ViewProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
              </Routes>
            
          
        
      
    );
  };
  
  const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();
  
    if (isLoading) {
      return <div>Loading...</div>; // Show a loading indicator while checking auth state
    }
  
    return isAuthenticated ? <Navigate to="/dashboard" /> : <>{children}</>;
  };
  
  const AuthRequired = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();
  
    if (isLoading) {
      return <div>Loading...</div>; // Show a loading indicator while checking auth state
    }
  
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
  };

  return (
    
      <Router>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <AuthSection type="login" />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <AuthSection type="register" />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <AuthSection type="forgot-password" />
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <AuthSection type="reset-password" />
              </PublicRoute>
            }
          />
          <Route
            path="*"
            element={
              <AuthRequired>
                <AuthRoutes />
              </AuthRequired>
            }
          />
        </Routes>
        <Toaster />
      </Router>
    
  );
}

function AuthSection({ type }: { type: string }) {
  return (
    
      
        {type === "login" && <Login />}
        {type === "register" && <Register />}
        {type === "forgot-password" && <ForgotPassword />}
        {type === "reset-password" && <ResetPassword />}
      
    
  );
}

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowLeft } from "lucide-react";

function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
      navigate("/dashboard");
    } catch (error) {
      // Handle sign-in errors (e.g., display an error message)
      console.error("Sign-in failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email and password to login
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 h-5 w-5 text-gray-500 peer-focus:text-gray-900" />
                <Input
                  id="email"
                  placeholder="Enter your email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-2.5 h-5 w-5 text-gray-500 peer-focus:text-gray-900" />
                <Input
                  id="password"
                  placeholder="Enter your password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full mt-4" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
          <div className="text-sm text-gray-500">
            <Link to="/forgot-password" className="hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="text-sm text-gray-500">
            Don't have an account?{" "}
            <Link to="/register" className="hover:underline">
              Register
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signUp(email, password);
      navigate("/onboarding");
    } catch (error) {
      // Handle sign-up errors (e.g., display an error message)
      console.error("Sign-up failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Register</CardTitle>
          <CardDescription>
            Enter your email and password to create an account
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 h-5 w-5 text-gray-500 peer-focus:text-gray-900" />
                <Input
                  id="email"
                  placeholder="Enter your email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-2.5 h-5 w-5 text-gray-500 peer-focus:text-gray-900" />
                <Input
                  id="password"
                  placeholder="Enter your password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full mt-4" disabled={isLoading}>
              {isLoading ? "Registering..." : "Register"}
            </Button>
          </form>
          <div className="text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="hover:underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Implement forgot password logic here (e.g., send a password reset email)
    console.log("Forgot password submitted for email:", email);
    setIsLoading(false);
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription>
            Enter your email to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 h-5 w-5 text-gray-500 peer-focus:text-gray-900" />
                <Input
                  id="email"
                  placeholder="Enter your email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full mt-4" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit"}
            </Button>
          </form>
          <div className="text-sm text-gray-500">
            <Link to="/login" className="hover:underline flex items-center">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Implement reset password logic here (e.g., update password in database)
    console.log("Reset password submitted with password:", password);
    setIsLoading(false);
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            Enter your new password
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-2.5 h-5 w-5 text-gray-500 peer-focus:text-gray-900" />
                <Input
                  id="password"
                  placeholder="Enter your new password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full mt-4" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit"}
            </Button>
          </form>
          <div className="text-sm text-gray-500">
            <Link to="/login" className="hover:underline flex items-center">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
