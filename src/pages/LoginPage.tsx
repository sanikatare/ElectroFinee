import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ElectroFineLogo, Button, Input } from '../components/ui/ElectroFineLogo';
import { electrofineApi } from '../lib/api';

export const LoginPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('Aarav Sharma');
  const [email, setEmail] = useState('aarav.sharma@electrofine.in');
  const [phone, setPhone] = useState('+91 98230 45120');
  const [role, setRole] = useState<'Recycler' | 'Collector'>('Recycler');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response =
        authMode === 'register'
          ? await electrofineApi.register({ name, email, phone, role })
          : await electrofineApi.login({ email, phone, role });

      if (response?.user) {
        localStorage.setItem('electrofine_user', JSON.stringify(response.user));
      }
      navigate(`/dashboard?role=${role}`);
    } catch {
      navigate(`/dashboard?role=${role}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#009150] text-white flex flex-col justify-between font-sans relative overflow-hidden">
      {/* Top Header */}
      <div className="p-6 relative z-10 max-w-7xl w-full mx-auto flex items-center justify-between">
        <Link to="/">
          <ElectroFineLogo size="md" />
        </Link>
        <Link to="/" className="text-xs font-semibold text-white/90 hover:text-white transition-colors">
          ← Back to Home
        </Link>
      </div>

      {/* Center Auth Card */}
      <div className="max-w-md w-full mx-auto px-6 py-6 relative z-10">
        <div className="bg-white text-juris-textPrimary border border-juris-border rounded-3xl p-8 shadow-elevated space-y-5">
          <div className="space-y-2 text-center flex flex-col items-center">
            <ElectroFineLogo size="lg" showText={false} />
            <h1 className="text-2xl font-extrabold text-juris-textPrimary pt-1">
              {authMode === 'login' ? 'Sign In to ElectroFine' : 'Create ElectroFine Account'}
            </h1>
            <p className="text-xs text-juris-textMuted">
              Schedule pickups, track your collector live & get paid fairly
            </p>
          </div>

          {/* Sign In / Register Switch */}
          <div className="flex items-center justify-center gap-6 border-b border-juris-border pb-3 text-xs font-bold">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`pb-1.5 border-b-2 transition-colors ${
                authMode === 'login'
                  ? 'border-[#009150] text-[#009150]'
                  : 'border-transparent text-juris-textMuted hover:text-juris-textPrimary'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`pb-1.5 border-b-2 transition-colors ${
                authMode === 'register'
                  ? 'border-[#009150] text-[#009150]'
                  : 'border-transparent text-juris-textMuted hover:text-juris-textPrimary'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Role Toggle */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-juris-textBody">
              Select Account Role
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-juris-bgSecondary rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setRole('Recycler');
                  if (email === 'rajesh.patil@electrofine.in') {
                    setName('Aarav Sharma');
                    setEmail('aarav.sharma@electrofine.in');
                  }
                }}
                className={`py-2.5 rounded-lg transition-colors ${
                  role === 'Recycler'
                    ? 'bg-[#009150] text-white'
                    : 'text-juris-textMuted hover:text-juris-textPrimary'
                }`}
              >
                User (Recycler)
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('Collector');
                  if (email === 'aarav.sharma@electrofine.in') {
                    setName('Rajesh Patil');
                    setEmail('rajesh.patil@electrofine.in');
                  }
                }}
                className={`py-2.5 rounded-lg transition-colors ${
                  role === 'Collector'
                    ? 'bg-[#009150] text-white'
                    : 'text-juris-textMuted hover:text-juris-textPrimary'
                }`}
              >
                Collector
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-juris-textBody mb-1.5">
                  Full Name
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-juris-textBody mb-1.5">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-juris-textBody">
                  Phone Number
                </label>
                <button
                  type="button"
                  onClick={() => navigate(`/dashboard?role=${role}`)}
                  className="text-xs text-[#009150] font-bold hover:underline"
                >
                  Quick Demo Login
                </button>
              </div>
              <Input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3"
              disabled={loading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {loading
                ? 'Signing In...'
                : authMode === 'login'
                ? `Sign In as ${role}`
                : `Create ${role} Account`}
            </Button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 text-center text-xs text-white/75 relative z-10">
        © 2026 ElectroFine
      </div>
    </div>
  );
};
