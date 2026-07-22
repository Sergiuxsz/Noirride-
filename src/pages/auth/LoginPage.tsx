import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, loginWithOAuth, resetPassword } = useAuth();
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [contactValue, setContactValue] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Forgot Password Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactValue || !password) {
      setError(t('auth.provideCredentials', 'Please provide both credentials.'));
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await login(contactValue, password);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 1200);
    } catch (err: any) {
      setError(err.message || t('auth.invalidCredentials', 'Invalid Executive Authentication credentials.'));
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setIsLoading(true);
    setError(null);
    try {
      await loginWithOAuth(provider);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 1200);
    } catch (err: any) {
      setError(err.message || t('auth.oauthFailed', 'Failed to verify identity with {{provider}}.', { provider: provider.toUpperCase() }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage(null);
    if (!resetEmail) {
      setResetMessage({ type: 'error', text: t('auth.enterEmail', 'Please enter your email address.') });
      return;
    }
    setIsResetting(true);
    try {
      await resetPassword(resetEmail);
      setResetMessage({
        type: 'success',
        text: t('auth.recoverySent', 'Password recovery instructions have been dispatched to your executive email address.'),
      });
    } catch (err: any) {
      setResetMessage({ type: 'error', text: err.message || t('auth.recoveryFailed', 'Failed to send recovery email.') });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center px-4 py-10 relative">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-secondary/90 border border-border rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative z-10">
        
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-500 text-[11px] font-semibold tracking-widest uppercase mb-3">
            {t('auth.clientAuth', 'Client Authentication')}
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-content font-bold tracking-tight">
            {t('auth.loginTitle', 'Log In to NoirRide')}
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1.5">
            {t('auth.loginSubtitle', 'Access your active bookings and chauffeur history.')}
          </p>
        </div>

        {!isSuccess ? (
          <>
            <div className="flex rounded-xl bg-primary p-1 border border-border mb-6">
              <button
                type="button"
                onClick={() => { setAuthMethod('email'); setError(null); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                  authMethod === 'email'
                    ? 'bg-gold-500 text-black shadow-md'
                    : 'text-muted hover:text-content'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                {t('auth.emailAddress', 'Email Address')}
              </button>
              <button
                type="button"
                onClick={() => { setAuthMethod('phone'); setError(null); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                  authMethod === 'phone'
                    ? 'bg-gold-500 text-black shadow-md'
                    : 'text-muted hover:text-content'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                {t('auth.phoneNumber', 'Phone Number')}
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

            <form onSubmit={handleLogin} className="space-y-4">
              {authMethod === 'email' ? (
                <Input
                  label={t('auth.vipEmail', 'VIP Email Address')}
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
                  label={t('auth.registeredPhone', 'Registered Phone Number')}
                  type="tel"
                  placeholder="+40 722 000 000"
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
                label={t('auth.securityPassphrase', 'Security Passphrase')}
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

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-muted">
                  <input type="checkbox" defaultChecked className="rounded border-white/20 bg-primary text-gold-500 focus:ring-gold-500/40 w-3.5 h-3.5" />
                  {t('auth.rememberCredentials', 'Remember credentials')}
                </label>
                 <button
                   type="button"
                   onClick={() => {
                     setResetEmail(contactValue.includes('@') ? contactValue : '');
                     setResetMessage(null);
                     setShowResetModal(true);
                   }}
                   className="text-xs text-gold-500 hover:underline"
                 >
                   {t('auth.forgotPassphrase', 'Forgot passphrase?')}
                 </button>
               </div>

               <Button
                 type="submit"
                 variant="primary"
                 isLoading={isLoading}
                 className="w-full py-3.5 text-xs font-bold tracking-widest uppercase mt-2 shadow-lg shadow-gold-500/15"
               >
                 {t('auth.loginToDashboard', 'Log In to Dashboard')}
               </Button>
             </form>

             <div className="relative flex items-center w-full my-6">
               <div className="flex-grow border-t border-border"></div>
               <span className="flex-shrink mx-4 text-[11px] font-semibold tracking-widest text-muted uppercase">
                 {t('auth.or', 'or')}
               </span>
               <div className="flex-grow border-t border-border"></div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
               <button
                 type="button"
                 onClick={() => handleOAuth('google')}
                 disabled={isLoading}
                 className="flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg bg-tertiary border border-border hover:bg-[#222634] hover:border-border/50 text-content text-xs font-medium transition-all duration-200"
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
                 className="flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg bg-tertiary border border-border hover:bg-[#222634] hover:border-border/50 text-content text-xs font-medium transition-all duration-200"
               >
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                   <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.35c.64-.78 1.08-1.86.96-2.95-.94.04-2.09.63-2.75 1.4-.59.68-.96 1.78-.82 2.85 1.05.08 2.15-.53 2.61-1.3" />
                 </svg>
                 <span>iPhone / Apple</span>
               </button>
             </div>
           </>
          ) : (
            <div className="text-center py-8 space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-500 mx-auto mb-2 shadow-lg shadow-gold-500/10">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <h3 className="font-serif text-xl font-bold text-white">{t('auth.authVerified', 'Authentication Verified')}</h3>
              <p className="text-xs sm:text-sm text-muted max-w-xs mx-auto leading-relaxed">
                {t('auth.redirecting', 'Successfully authenticated. Redirecting to your active chauffeur itineraries...')}
              </p>
             <div className="pt-3">
               <Button
                 onClick={() => navigate('/')}
                 variant="primary"
                 className="w-full py-3 text-xs font-bold tracking-widest uppercase"
               >
                 {t('auth.goToBookings', 'Go to Bookings')}
               </Button>
             </div>
           </div>
         )}

          <div className="mt-8 pt-5 border-t border-white/5 text-center">
            <p className="text-xs text-muted">
              {t('auth.newToNoirRide', 'New to NoirRide? ')}
              <Link to="/register" className="text-gold-500 hover:underline font-semibold ml-1">
                {t('auth.applyVipAccess', 'Apply for VIP Access')}
              </Link>
            </p>
         </div>
       </div>

       {/* Forgot Passphrase Modal */}
       {showResetModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-fade-in">
           <div className="w-full max-w-md bg-secondary border border-border rounded-2xl p-6 sm:p-8 shadow-2xl relative">
             <button
               type="button"
               onClick={() => setShowResetModal(false)}
               className="absolute top-4 right-4 text-muted hover:text-white p-1 rounded-lg transition-colors"
             >
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                 <path d="M18 6 6 18M6 6l12 12" />
               </svg>
             </button>

              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-500 mx-auto mb-3">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2v0Z" />
                    <path d="M12 8v4" />
                    <path d="M12 16h.01" />
                  </svg>
                </div>
                <h3 className="font-serif text-xl font-bold text-white tracking-tight">
                  {t('auth.recoveryTitle', 'Executive Credential Recovery')}
                </h3>
                <p className="text-xs text-muted mt-1.5 leading-relaxed">
                  {t('auth.recoveryDesc', 'Enter your executive email to dispatch secure password recovery instructions.')}
                </p>
              </div>

             <form onSubmit={handleResetPassword} className="space-y-4">
               <Input
                 label={t('auth.executiveEmail', 'Executive Email Address')}
                 type="email"
                 placeholder="client@noirride.vip"
                 value={resetEmail}
                 onChange={(e) => setResetEmail(e.target.value)}
                 leftIcon={
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                     <rect width="20" height="16" x="2" y="4" rx="2" />
                     <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                   </svg>
                 }
                 required
               />

               {resetMessage && (
                 <div
                   className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                     resetMessage.type === 'success'
                       ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                       : 'bg-red-500/10 border-red-500/30 text-red-400'
                   }`}
                 >
                   <span className="flex-shrink-0">
                     {resetMessage.type === 'success' ? '✓' : '⚠'}
                   </span>
                   <span>{resetMessage.text}</span>
                 </div>
               )}

               <div className="flex gap-3 pt-2">
                 <button
                   type="button"
                   onClick={() => setShowResetModal(false)}
                   className="flex-1 py-3 px-4 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-content text-xs font-semibold uppercase tracking-widest border border-border transition-colors"
                 >
                   {t('common.cancel', 'Cancel')}
                 </button>
                 <Button
                   type="submit"
                   variant="primary"
                   isLoading={isResetting}
                   className="flex-1 py-3 text-xs font-bold tracking-widest uppercase"
                 >
                   {t('auth.sendLink', 'Send Link')}
                 </Button>
               </div>
             </form>
           </div>
         </div>
       )}
     </div>
   );
 };
