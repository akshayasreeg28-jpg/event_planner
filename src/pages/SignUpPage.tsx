import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Flame, Mail, Lock, User } from 'lucide-react';

export const SignUpPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const { signup, loginWithGoogle, error: authError } = useAuth();
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const navigate = useNavigate();

  const validate = () => {
    let isValid = true;
    setNameError(null);
    setEmailError(null);
    setPasswordError(null);

    if (!name.trim()) {
      setNameError('Please enter your full name.');
      isValid = false;
    } else if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters long.');
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Please enter your email address.');
      isValid = false;
    } else if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address (e.g., name@domain.com).');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Please create a password.');
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
      await signup(name.trim(), email.trim(), password);
      navigate('/dashboard');
    } catch (err: any) {
      setLocalError(err.message || 'Failed to create account. Please try again.');
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
        <h2 className="text-2xl font-bold font-serif text-[#1E1B24]">Create your planner account</h2>
        <p className="mt-1 text-xs text-[#5C5765]">
          Start building production-grade event plans in seconds.
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
              <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#5C5765] absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  placeholder="Priya Ramanathan"
                  className={`w-full pl-10 pr-4 py-2 text-sm bg-[#F3EEF8]/40 border rounded-xl text-[#1E1B24] focus:outline-none focus:ring-2 ${
                    nameError ? 'border-rose-400 focus:ring-rose-400' : 'border-[#4B2A7B]/15 focus:ring-[#4B2A7B]'
                  }`}
                />
              </div>
              {nameError && <p className="mt-1 text-[11px] text-rose-600">{nameError}</p>}
            </div>

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
                  placeholder="priya@example.com"
                  className={`w-full pl-10 pr-4 py-2 text-sm bg-[#F3EEF8]/40 border rounded-xl text-[#1E1B24] focus:outline-none focus:ring-2 ${
                    emailError ? 'border-rose-400 focus:ring-rose-400' : 'border-[#4B2A7B]/15 focus:ring-[#4B2A7B]'
                  }`}
                />
              </div>
              {emailError && <p className="mt-1 text-[11px] text-rose-600">{emailError}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#5C5765] absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  placeholder="At least 6 characters"
                  className={`w-full pl-10 pr-4 py-2 text-sm bg-[#F3EEF8]/40 border rounded-xl text-[#1E1B24] focus:outline-none focus:ring-2 ${
                    passwordError ? 'border-rose-400 focus:ring-rose-400' : 'border-[#4B2A7B]/15 focus:ring-[#4B2A7B]'
                  }`}
                />
              </div>
              {passwordError && <p className="mt-1 text-[11px] text-rose-600">{passwordError}</p>}
            </div>

            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
              Create Account
            </Button>
          </form>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#4B2A7B]/10"></div>
            <span className="flex-shrink mx-4 text-[11px] text-[#5C5765] uppercase">Or register with</span>
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
            Google Account
          </Button>

          <div className="text-center text-xs text-[#5C5765]">
            Already have an account?{' '}
            <Link to="/signin" className="text-[#4B2A7B] font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
