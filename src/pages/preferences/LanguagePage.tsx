import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  region: string;
}

export const LanguagePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedLang, setSelectedLang] = useState('EN');
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  const [isSaved, setIsSaved] = useState(false);

  const languages: LanguageOption[] = [
    { code: 'EN', name: 'English (UK / Global)', nativeName: 'English', flag: '🇬🇧', region: 'Europe & International' },
    { code: 'RO', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴', region: 'Eastern Europe / Romania' },
    { code: 'FR', name: 'French', nativeName: 'Français', flag: '🇫🇷', region: 'Western Europe / Switzerland' },
    { code: 'DE', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', region: 'Central Europe / DACH' },
    { code: 'IT', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', region: 'Southern Europe / Italy' },
  ];

  const currencies = [
    { code: 'EUR', symbol: '€', name: 'Euro (Default VIP Currency)' },
    { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
    { code: 'GBP', symbol: '£', name: 'British Pound Sterling' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
  ];

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => {
      navigate('/');
    }, 1200);
  };

  return (
    <div className="container-custom py-10 px-4 max-w-3xl mx-auto min-h-[calc(100vh-140px)] flex flex-col justify-center">
      <div className="bg-[#12141C] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[11px] font-semibold tracking-widest uppercase mb-3">
            Regional Customization
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#F8FAFC] font-bold tracking-tight">
            Language & Currency Protocol
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] max-w-md mx-auto mt-1.5">
            Select your preferred display language and billing currency for chauffeur reservations and invoices.
          </p>
        </div>

        {/* Language Selection Grid */}
        <div className="mb-8">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-3">
            Select Display Language
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => { setSelectedLang(lang.code); setIsSaved(false); }}
                className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 ${
                  selectedLang === lang.code
                    ? 'bg-[#0A0B0E] border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10 ring-1 ring-[#D4AF37]/40'
                    : 'bg-[#0A0B0E]/50 border-white/10 hover:border-white/20 hover:bg-[#0A0B0E]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <div>
                    <div className="font-semibold text-sm text-[#F8FAFC] flex items-center gap-2">
                      {lang.nativeName}
                      <span className="text-[10px] text-[#94A3B8] font-mono font-normal">({lang.code})</span>
                    </div>
                    <div className="text-[11px] text-[#94A3B8]">{lang.region}</div>
                  </div>
                </div>
                {selectedLang === lang.code && (
                  <div className="w-5 h-5 rounded-full bg-[#D4AF37] text-black flex items-center justify-center text-xs font-bold">
                    ✓
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Currency Selection Grid */}
        <div className="mb-8">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-3">
            Select Settlement Currency
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {currencies.map((curr) => (
              <button
                key={curr.code}
                type="button"
                onClick={() => { setSelectedCurrency(curr.code); setIsSaved(false); }}
                className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all duration-200 ${
                  selectedCurrency === curr.code
                    ? 'bg-[#0A0B0E] border-[#D4AF37] shadow-md ring-1 ring-[#D4AF37]/30'
                    : 'bg-[#0A0B0E]/40 border-white/10 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="font-bold font-mono text-sm text-white flex items-center gap-1.5">
                    <span className="text-[#D4AF37]">{curr.symbol}</span>
                    <span>{curr.code}</span>
                  </div>
                  <div className="text-[10px] text-[#94A3B8] truncate max-w-[120px]">{curr.name}</div>
                </div>
                {selectedCurrency === curr.code && (
                  <span className="text-[#D4AF37] font-bold text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {isSaved ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center text-xs sm:text-sm font-semibold animate-fade-in flex items-center justify-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            <span>Preferences updated: [{selectedLang}] & [{selectedCurrency}]. Returning to dashboard...</span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="primary"
              onClick={handleSave}
              className="flex-1 py-3.5 text-xs font-bold tracking-widest uppercase shadow-lg shadow-[#D4AF37]/15"
            >
              Apply Regional Settings
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/')}
              className="py-3.5 px-6 text-xs"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
