import React, { useState } from 'react';
import { Search, ShieldCheck, Layers, Hash, Rocket, Sparkles } from 'lucide-react';
import { CrawlConfig } from '../types';
import { useLanguage } from '../LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

interface LandingCardProps {
    onLaunch: (config: CrawlConfig) => void;
    isLoading?: boolean;
}

const LandingCard: React.FC<LandingCardProps> = ({ onLaunch, isLoading = false }) => {
    const { t } = useLanguage();
    const [siren, setSiren] = useState('');
    const [depth, setDepth] = useState(2);
    const [limit, setLimit] = useState(100);
    const [apiKey, setApiKey] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!siren.trim()) return;

        onLaunch({
            apiKey: apiKey.trim() || 'DEMO',
            rootSiren: siren.replace(/\s/g, ''),
            maxDepth: depth,
            limit
        });
    };

    const handleDemoFill = () => {
        setSiren('443061841');
        setApiKey('DEMO');
    };

    return (
        <div className="glass rounded-3xl p-8 md:p-12 w-full max-w-2xl animate-slide-up glow-border relative">
            {/* Language Switcher - Top Right */}
            <div className="absolute top-4 right-4">
                <LanguageSwitcher />
            </div>

            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-3 mb-6">
                    <img
                        src="https://static.homunity.com/1.2.10/img/logo.svg"
                        alt="Homunity"
                        className="h-20 brightness-0 invert"
                    />
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Main SIREN Input - Search Engine Style */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyber-primary/20 to-cyber-glow/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-60"></div>
                    <div className="relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-cyber-glow" />
                        <input
                            type="text"
                            value={siren}
                            onChange={(e) => setSiren(e.target.value)}
                            placeholder={t.landing.sirenPlaceholder}
                            maxLength={14}
                            className="w-full pl-14 pr-6 py-5 text-lg cyber-input rounded-2xl focus:ring-2 focus:ring-cyber-glow/50"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleDemoFill}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-cyber-glow hover:text-white transition-colors font-medium px-3 py-1 rounded-lg bg-cyber-glow/10 hover:bg-cyber-glow/20"
                    >
                        Demo
                    </button>
                </div>

                {/* Secondary Inputs Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Scan Depth */}
                    <div className="glass-light rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Layers className="w-4 h-4 text-cyber-purple" />
                            <label className="text-sm font-medium text-slate-300">{t.landing.depthLabel}</label>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min="1"
                                max="4"
                                step="1"
                                value={depth}
                                onChange={(e) => setDepth(parseInt(e.target.value))}
                                className="flex-1"
                            />
                            <span className="text-lg font-bold text-cyber-glow font-cyber w-8 text-center">
                                {depth}
                            </span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>1</span>
                            <span>4</span>
                        </div>
                    </div>

                    {/* Entity Limit */}
                    <div className="glass-light rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Hash className="w-4 h-4 text-cyber-pink" />
                            <label className="text-sm font-medium text-slate-300">{t.landing.limitLabel}</label>
                        </div>
                        <input
                            type="number"
                            min="10"
                            max="500"
                            value={limit}
                            onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
                            className="w-full py-2 px-3 cyber-input rounded-lg text-center font-mono"
                        />
                    </div>

                    {/* API Key */}
                    <div className="glass-light rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <ShieldCheck className="w-4 h-4 text-cyber-success" />
                            <label className="text-sm font-medium text-slate-300">{t.landing.apiTokenLabel}</label>
                        </div>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={t.landing.apiTokenPlaceholder}
                            className="w-full py-2 px-3 cyber-input rounded-lg text-sm"
                        />
                    </div>
                </div>

                {/* Launch Button */}
                <button
                    type="submit"
                    disabled={isLoading || !siren.trim()}
                    className="w-full py-4 px-6 cyber-btn rounded-xl text-white font-bold text-lg flex items-center justify-center gap-3 animate-pulse-glow"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {t.landing.scanning}
                        </>
                    ) : (
                        <>
                            <Rocket className="w-5 h-5" />
                            {t.landing.launchButton}
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default LandingCard;

