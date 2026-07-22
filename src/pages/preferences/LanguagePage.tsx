import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useTranslation } from 'react-i18next';

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  region: string;
}

export const LanguagePage: React.FC = () => {
  const { t, i18n } = useTranslation();
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
    i18n.changeLanguage(selectedLang.toLowerCase());
    setTimeout(() => {
      navigate('/');
    }, 1200);
  };

  return (
    <div className="container-custom py-10 px-4 max-w-3xl mx-auto min-h-[calc(100vh-140px)] flex flex-col justify-center">
      <div className="bg-secondary border border-border rounded-2xl p-6 sm:p-8 shadow-2xl relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-500 text-[11px] font-semibold tracking-widest uppercase mb-3">
            {t('lang.regional', 'Regional Customization')}
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-content font-bold tracking-tight">
            {t('lang.title', 'Language & Currency Protocol')}
          </h1>
          <p className="text-xs sm:text-sm text-muted max-w-md mx-auto mt-1.5">
            {t('lang.subtitle', 'Select your preferred display language and billing currency for chauffeur reservations and invoices.')}
          </p>
        </div>

        {/* Language Selection Grid */}
        <div className="mb-8">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
            {t('lang.selectLang', 'Select Display Language')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => { setSelectedLang(lang.code); setIsSaved(false); }}
                className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 ${
                  selectedLang === lang.code
                    ? 'bg-primary border-gold-500 shadow-lg shadow-gold-500/10 ring-1 ring-gold-500/40'
                    : 'bg-primary/50 border-border hover:border-border/50 hover:bg-primary'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <div>
                    <div className="font-semibold text-sm text-content flex items-center gap-2">
                      {lang.nativeName}
                      <span className="text-[10px] text-muted font-mono font-normal">({lang.code})</span>
                    </div>
                    <div className="text-[11px] text-muted">{lang.region}</div>
                  </div>
                </div>
                {selectedLang === lang.code && (
                  <div className="w-5 h-5 rounded-full bg-gold-500 text-black flex items-center justify-center text-xs font-bold">
                    ✓
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Currency Selection Grid */}
        <div className="mb-8">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
            {t('lang.selectCurrency', 'Select Settlement Currency')}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {currencies.map((curr) => (
              <button
                key={curr.code}
                type="button"
                onClick={() => { setSelectedCurrency(curr.code); setIsSaved(false); }}
                className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all duration-200 ${
                  selectedCurrency === curr.code
                    ? 'bg-primary border-gold-500 shadow-md ring-1 ring-gold-500/30'
                    : 'bg-primary/40 border-border hover:border-border/50'
                }`}
              >
                <div>
                  <div className="font-bold font-mono text-sm text-content flex items-center gap-1.5">
                    <span className="text-gold-500">{curr.symbol}</span>
                    <span>{curr.code}</span>
                  </div>
                  <div className="text-[10px] text-muted truncate max-w-[120px]">{curr.name}</div>
                </div>
                {selectedCurrency === curr.code && (
                  <span className="text-gold-500 font-bold text-xs">✓</span>
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
            <span>{t('lang.updated', 'Preferences updated: [{{lang}}] & [{{curr}}]. Returning to dashboard...', { lang: selectedLang, curr: selectedCurrency })}</span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="primary"
              onClick={handleSave}
              className="flex-1 py-3.5 text-xs font-bold tracking-widest uppercase shadow-lg shadow-gold-500/15"
            >
              {t('lang.apply', 'Apply Regional Settings')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/')}
              className="py-3.5 px-6 text-xs"
            >
              {t('common.cancel', 'Cancel')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
