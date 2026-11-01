import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Flame, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { DEMO_USERS } from '../lib/storage';

export const SignInPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const { login, loginWithGoogle, error: authError } = useAuth();
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const navigate = useNavigate();

  const validate = () => {
    let isValid = true;
    setEmailError(null);
    setPasswordError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Please enter your email address.');
      isValid = false;
    } else if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address (e.g., name@domain.com).');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Please enter your password.');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLocalError(null);
    setIsLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err: any) {
      setLocalError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoUser = async (userEmail: string) => {
    setIsLoading(true);
    try {
      await login(userEmail);
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF7F0] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
          <div className="w-10 h-10 rounded-xl bg-[#4B2A7B] text-white flex items-center justify-center shadow-md">
            <Flame className="w-5 h-5 text-[#FF7A6B]" />
          </div>
          <span className="text-2xl font-bold font-serif text-[#1E1B24]">Event AI</span>
        </Link>
        <h2 className="text-2xl font-bold font-serif text-[#1E1B24]">Sign in to your event workspace</h2>
        <p className="mt-1 text-xs text-[#5C5765]">
          Manage budgets, timelines, guests, and AI generations in real time.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Card variant="elevated" padding="lg" className="space-y-6">
          {(localError || authError) && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {localError || authError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#5C5765] absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  placeholder="planner@example.com"
                  className={`w-full pl-10 pr-4 py-2 text-sm bg-[#F3EEF8]/40 border rounded-xl text-[#1E1B24] focus:outline-none focus:ring-2 ${
                    emailError ? 'border-rose-400 focus:ring-rose-400' : 'border-[#4B2A7B]/15 focus:ring-[#4B2A7B]'
                  }`}
                />
              </div>
              {emailError && <p className="mt-1 text-[11px] text-rose-600">{emailError}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-[#1E1B24]">Password</label>
                <Link to="/forgot-password" className="text-xs text-[#4B2A7B] hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#5C5765] absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-2 text-sm bg-[#F3EEF8]/40 border rounded-xl text-[#1E1B24] focus:outline-none focus:ring-2 ${
                    passwordError ? 'border-rose-400 focus:ring-rose-400' : 'border-[#4B2A7B]/15 focus:ring-[#4B2A7B]'
                  }`}
                />
              </div>
              {passwordError && <p className="mt-1 text-[11px] text-rose-600">{passwordError}</p>}
            </div>

            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#4B2A7B]/10"></div>
            <span className="flex-shrink mx-4 text-[11px] text-[#5C5765] uppercase">Or continue with</span>
            <div className="flex-grow border-t border-[#4B2A7B]/10"></div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={async () => {
              setIsLoading(true);
              try {
                await loginWithGoogle();
                navigate('/dashboard');
              } finally {
                setIsLoading(false);
              }
            }}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Sign in with Google
          </Button>

          {/* Quick Demo Persona Shortcuts */}
          <div className="pt-2">
            <p className="text-[11px] font-semibold text-[#5C5765] uppercase tracking-wider mb-2 text-center">
              Quick 1-Click Demo Login
            </p>
            <div className="grid grid-cols-1 gap-2">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickDemoUser(u.email)}
                  className="flex items-center justify-between p-2 rounded-xl border border-[#4B2A7B]/15 bg-[#F3EEF8]/40 hover:bg-[#F3EEF8] transition-colors text-left text-xs cursor-pointer"
                >
                  <span className="font-medium text-[#1E1B24]">{u.name}</span>
                  <span className="text-[10px] text-[#4B2A7B] font-semibold flex items-center gap-1">
                    Demo <ArrowRight className="w-3 h-3" />
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="text-center text-xs text-[#5C5765]">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#4B2A7B] font-semibold hover:underline">
              Create account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
