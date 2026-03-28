'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { LogIn, Eye, EyeOff, Zap, Shield, UserCog, User } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
    setLoading(false);
  };

  const quickLogin = async (email: string, pass: string) => {
    setEmail(email);
    setPassword(pass);
    setError('');
    setLoading(true);
    const result = await login(email, pass);
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-bg-grid" />
      <div className="login-container">
        {/* Left Panel */}
        <div className="login-hero">
          <div className="login-hero-content">
            <div className="login-logo">
              <Zap size={32} />
            </div>
            <h1>Magic Life</h1>
            <p className="login-hero-subtitle">Personal Ops System</p>
            <div className="login-hero-features">
              <div className="login-feature">
                <Shield size={18} /> Role-based access control
              </div>
              <div className="login-feature">
                <UserCog size={18} /> Jira-like task management
              </div>
              <div className="login-feature">
                <User size={18} /> Team collaboration
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="login-form-panel">
          <div className="login-form-wrapper">
            <h2>Welcome Back</h2>
            <p className="login-form-subtitle">Sign in to your account</p>

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="login-field">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="login-field">
                <label>Password</label>
                <div className="login-password-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="login-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="login-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="login-spinner" />
                ) : (
                  <>
                    <LogIn size={18} /> Sign In
                  </>
                )}
              </button>
            </form>

            {/* Quick Login */}
            <div className="login-quick">
              <p className="login-quick-title">Quick Login</p>
              <div className="login-quick-cards">
                <button
                  className="login-quick-card"
                  onClick={() => quickLogin('admin@magiclife.com', 'admin123')}
                >
                  <div className="login-quick-avatar" style={{ background: '#f43f5e' }}>
                    <Shield size={16} />
                  </div>
                  <div>
                    <div className="login-quick-role">Admin</div>
                    <div className="login-quick-email">admin@magiclife.com</div>
                  </div>
                </button>
                <button
                  className="login-quick-card"
                  onClick={() => quickLogin('manager@magiclife.com', 'manager123')}
                >
                  <div className="login-quick-avatar" style={{ background: '#f97316' }}>
                    <UserCog size={16} />
                  </div>
                  <div>
                    <div className="login-quick-role">Manager</div>
                    <div className="login-quick-email">manager@magiclife.com</div>
                  </div>
                </button>
                <button
                  className="login-quick-card"
                  onClick={() => quickLogin('staff@magiclife.com', 'staff123')}
                >
                  <div className="login-quick-avatar" style={{ background: '#3b82f6' }}>
                    <User size={16} />
                  </div>
                  <div>
                    <div className="login-quick-role">Staff</div>
                    <div className="login-quick-email">staff@magiclife.com</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
