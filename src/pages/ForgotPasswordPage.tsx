import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Flame, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

import { useAuth } from '../features/auth/AuthContext';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { sendPasswordReset } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      await sendPasswordReset(email);
      setIsSubmitted(true);
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
        <h2 className="text-2xl font-bold font-serif text-[#1E1B24]">Reset your password</h2>
        <p className="mt-1 text-xs text-[#5C5765]">
          Enter your registered email and we will send you a secure recovery link.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Card variant="elevated" padding="lg">
          {isSubmitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-[#1E1B24]">Reset link dispatched</h3>
              <p className="text-xs text-[#5C5765] leading-relaxed">
                If an account exists for <strong>{email}</strong>, you will receive password reset instructions shortly.
              </p>
              <Link to="/signin">
                <Button variant="primary" className="w-full mt-4">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1E1B24] mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#5C5765] absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2 text-sm bg-[#F3EEF8]/40 border border-[#4B2A7B]/15 rounded-xl text-[#1E1B24] focus:outline-none focus:ring-2 focus:ring-[#4B2A7B]"
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" className="w-full">
                Send Recovery Link
              </Button>

              <div className="text-center pt-2">
                <Link
                  to="/signin"
                  className="inline-flex items-center gap-1.5 text-xs text-[#5C5765] hover:text-[#4B2A7B] font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
