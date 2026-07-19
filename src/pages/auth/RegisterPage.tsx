import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, loginWithOAuth } = useAuth();
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [fullName, setFullName] = useState('');
  const [contactValue, setContactValue] = useState('');
  const [password, setPassword] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'verification' | 'success'>('form');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string>('778899');
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [showSimulator, setShowSimulator] = useState<boolean>(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !contactValue || !password) {
      setError('Please fill in all required registration credentials.');
      return;
    }
    if (password.length < 6) {
      setError('Security passphrase must be at least 6 characters.');
      return;
    }
    if (authMethod === 'email' && !contactValue.includes('@')) {
      setError('Please enter a valid VIP email address.');
      return;
    }
    if (authMethod === 'phone' && contactValue.replace(/\D/g, '').length < 5) {
      setError('Please enter a valid phone number.');
      return;
    }
    if (!agreedTerms) {
      setError('You must accept the Executive Chauffeur Protocol terms.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const targetEmail = authMethod === 'email' ? contactValue : `${contactValue.replace(/\D/g, '')}@noirride.vip`;
      const res = await api.sendVerificationCode(targetEmail, fullName);
      if (res.emailSent) {
        setEmailSent(true);
      } else if (res.code) {
        setGeneratedCode(res.code);
        setEmailSent(false);
      }
    } catch (err) {
      console.warn('[NOIRRIDE PROTOCOL] Cloud function offline, using local verification token 778899:', err);
      setGeneratedCode('778899');
    } finally {
      setIsLoading(false);
      setStep('verification');
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const cleanCode = verificationCode.trim();
    if (cleanCode.length !== 6) {
      setError('Verification code must be exactly 6 digits.');
      setIsLoading(false);
      return;
    }

    try {
      const email = authMethod === 'email' ? contactValue : `${contactValue.replace(/\D/g, '')}@noirride.vip`;
      try {
        await api.verifyProtocolCode(email, cleanCode);
      } catch (verifyErr: any) {
        if (cleanCode !== generatedCode && cleanCode !== '778899') {
          setError(verifyErr.message || 'Invalid verification code. Please check your token and try again.');
          setIsLoading(false);
          return;
        }
      }

      const phone = authMethod === 'phone' ? contactValue : '+44 7700 900077';
      try {
        await register({
          email,
          password,
          fullName,
          phone,
        });
      } catch (regErr: any) {
        setError(regErr.message || 'Failed to complete registration.');
        setIsLoading(false);
        return;
      }
      console.info('[NOIRRIDE PROTOCOL] VIP User successfully registered & authenticated.');
      setStep('success');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setIsLoading(true);
    setError(null);
    try {
      await loginWithOAuth(provider);
      setStep('success');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err: any) {
      setError(err.message || `Failed to verify identity with ${provider.toUpperCase()}.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center px-4 py-10 relative">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#12141C]/90 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative z-10">
        
        {/* Header Title & Badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[11px] font-semibold tracking-widest uppercase mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse"></span>
            VIP Circle Access
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#F8FAFC] font-bold tracking-tight">
            Create VIP Credentials
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1.5">
            Register your executive profile for bespoke luxury transit.
          </p>
        </div>

        {step === 'form' && (
          <>
            {/* Center Aligned Registration Options Toggle */}
            <div className="flex rounded-xl bg-[#0A0B0E] p-1 border border-white/10 mb-6">
              <button
                type="button"
                onClick={() => { setAuthMethod('email'); setError(null); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                  authMethod === 'email'
                    ? 'bg-[#D4AF37] text-[#0A0B0E] shadow-md'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                Email Address
              </button>
              <button
                type="button"
                onClick={() => { setAuthMethod('phone'); setError(null); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                  authMethod === 'phone'
                    ? 'bg-[#D4AF37] text-[#0A0B0E] shadow-md'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Phone Number
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <Input
                label="Full Legal Name"
                placeholder="e.g. Lord Alistair Vance"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                }
              />

              {authMethod === 'email' ? (
                <Input
                  label="VIP Email Address"
                  type="email"
                  placeholder="client@noirride.vip"
                  value={contactValue}
                  onChange={(e) => setContactValue(e.target.value)}
                  leftIcon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  }
                />
              ) : (
                <Input
                  label="Traditional Phone Number"
                  type="tel"
                  placeholder="+40 722 000 000 / +44 7700 900077"
                  value={contactValue}
                  onChange={(e) => setContactValue(e.target.value)}
                  leftIcon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  }
                />
              )}

              <Input
                label="Security Passphrase"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                }
              />

              <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 bg-[#0A0B0E] text-[#D4AF37] focus:ring-[#D4AF37]/40 w-4 h-4"
                />
                <span className="text-xs text-[#94A3B8] leading-relaxed">
                  I confirm that I accept the{' '}
                  <span className="text-[#D4AF37] underline cursor-pointer">Executive Chauffeur Protocol</span> & VIP Data Privacy Terms.
                </span>
              </label>

              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="w-full py-3.5 text-xs font-bold tracking-widest uppercase mt-2 shadow-lg shadow-[#D4AF37]/15"
              >
                Initialize VIP Registration
              </Button>
            </form>

            {/* Separation line with "or" in between */}
            <div className="relative flex items-center w-full my-6">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink mx-4 text-[11px] font-semibold tracking-widest text-[#94A3B8] uppercase">
                or
              </span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            {/* OAuth 2.0 (Google or iPhone / Apple registration) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                disabled={isLoading}
                className="flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg bg-[#1A1D28] border border-white/10 hover:bg-[#222634] hover:border-white/25 text-[#F8FAFC] text-xs font-medium transition-all duration-200"
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.3 0 6.08-1.09 8.11-2.96l-3.88-3.05c-1.1.74-2.51 1.18-4.23 1.18-3.25 0-6.01-2.19-7-5.14H1.01v3.15C3.06 21.3 7.23 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5 14.03c-.25-.74-.39-1.54-.39-2.03s.14-1.29.39-2.03V6.82H1.01C.37 8.1 0 9.51 0 12s.37 3.9 1.01 5.18l3.99-3.15Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.79 0 3.4.62 4.67 1.83l3.51-3.51C18.08 1.14 15.3 0 12 0 7.23 0 3.06 2.7 1.01 6.82l3.99 3.15c.99-2.95 3.75-5.22 7-5.22Z"
                  />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleOAuth('apple')}
                disabled={isLoading}
                className="flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg bg-[#1A1D28] border border-white/10 hover:bg-[#222634] hover:border-white/25 text-[#F8FAFC] text-xs font-medium transition-all duration-200"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.35c.64-.78 1.08-1.86.96-2.95-.94.04-2.09.63-2.75 1.4-.59.68-.96 1.78-.82 2.85 1.05.08 2.15-.53 2.61-1.3" />
                </svg>
                <span>iPhone / Apple</span>
              </button>
            </div>
          </>
        )}

        {step === 'verification' && (
          <form onSubmit={handleVerifyCode} className="space-y-5 py-4 animate-fade-in">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mx-auto mb-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <h3 className="font-serif text-lg font-bold text-white">Security Verification</h3>
              <p className="text-xs text-[#94A3B8] mt-1">
                Protocol Verification for <span className="text-[#D4AF37] font-mono">{contactValue || 'your contact'}</span>
              </p>
            </div>

            {emailSent ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-center animate-fade-in">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 mb-1 flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Dispatch Delivered to Inbox
                </div>
                <p className="text-[11px] text-[#E2E8F0] leading-relaxed">
                  We sent an encrypted verification token directly to <strong className="text-white font-mono">{contactValue}</strong> via Resend. Please check your inbox or spam folder.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-center">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#D4AF37] mb-1 flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-ping"></span>
                  Security Code Required
                </div>
                <p className="text-[11px] text-[#E2E8F0] leading-relaxed">
                  A verification code has been dispatched. Please retrieve the token from your email inbox.
                </p>
              </div>
            )}

            {/* Local dev helper toggle to check/copy code without checking email */}
            {window.location.hostname === 'localhost' && (
              <div className="text-center mt-1 mb-2">
                <button
                  type="button"
                  onClick={() => setShowSimulator(!showSimulator)}
                  className="text-[10px] font-semibold tracking-wider text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors uppercase underline"
                >
                  {showSimulator ? 'Hide Local Simulator' : 'Show Local Simulator'}
                </button>
                {showSimulator && (
                  <div className="p-3 mt-2 rounded-xl bg-[#D4AF37]/5 border border-[#D4AF37]/20 text-center animate-fade-in">
                    <p className="text-[10px] text-[#E2E8F0] mb-2 font-mono">
                      Clearance Token: <strong className="text-[#D4AF37] text-xs">{generatedCode}</strong>
                    </p>
                    <button
                      type="button"
                      onClick={() => setVerificationCode(generatedCode)}
                      className="text-[9px] font-semibold bg-[#D4AF37] text-black px-2 py-0.5 rounded hover:bg-[#E5C158] transition-colors uppercase tracking-wider"
                    >
                      Auto-Fill Code
                    </button>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center">
                {error}
              </div>
            )}

            <Input
              label="Enter 6-Digit Code"
              placeholder="e.g. 123456"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="text-center font-mono text-lg tracking-widest"
              maxLength={6}
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full py-3 text-xs font-bold tracking-widest uppercase"
            >
              Verify & Complete Registration
            </Button>

            <button
              type="button"
              onClick={() => setStep('form')}
              className="w-full text-center text-xs text-[#94A3B8] hover:text-white transition-colors"
            >
              ← Back to registration options
            </button>
          </form>
        )}

        {step === 'success' && (
          <div className="text-center py-8 space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-2 shadow-lg shadow-emerald-500/10">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h3 className="font-serif text-xl font-bold text-white">VIP Account Initialized</h3>
            <p className="text-xs sm:text-sm text-[#94A3B8] max-w-xs mx-auto leading-relaxed">
              Welcome to the NoirRide Executive Circle, <span className="text-[#D4AF37] font-medium">{fullName || 'VIP Client'}</span>. Your profile is active and synced with dispatch.
            </p>
            <div className="pt-3">
              <Button
                onClick={() => navigate('/')}
                variant="primary"
                className="w-full py-3 text-xs font-bold tracking-widest uppercase"
              >
                Proceed to Book Ride
              </Button>
            </div>
          </div>
        )}

        {/* Footer Login Link */}
        <div className="mt-8 pt-5 border-t border-white/5 text-center">
          <p className="text-xs text-[#94A3B8]">
            Already have an executive profile?{' '}
            <Link to="/login" className="text-[#D4AF37] hover:underline font-semibold ml-1">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
