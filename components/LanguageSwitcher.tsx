import React from 'react';
import { useLanguage } from '../LanguageContext';

const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="flex items-center gap-1 glass rounded-lg p-1">
            <button
                onClick={() => setLanguage('fr')}
                className={`px-2 py-1 rounded text-xs font-bold transition-all ${language === 'fr'
                        ? 'bg-cyber-glow/30 text-cyber-glow'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
            >
                FR
            </button>
            <span className="text-slate-600">|</span>
            <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded text-xs font-bold transition-all ${language === 'en'
                        ? 'bg-cyber-glow/30 text-cyber-glow'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
            >
                EN
            </button>
        </div>
    );
};

export default LanguageSwitcher;
