import React, { useState } from 'react';
import { Search, Layers, Hash, RotateCcw, Network, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { CrawlConfig, CrawlStats } from '../types';
import { useLanguage } from '../LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

interface ResultsHeaderProps {
    config: CrawlConfig;
    stats: CrawlStats;
    isLoading: boolean;
    onNewScan: (config: CrawlConfig) => void;
    onCancel: () => void;
}

const ResultsHeader: React.FC<ResultsHeaderProps> = ({
    config,
    stats,
    isLoading,
    onNewScan,
    onCancel
}) => {
    const { t } = useLanguage();
    const [siren, setSiren] = useState(config.rootSiren);
    const [depth, setDepth] = useState(config.maxDepth);
    const [limit, setLimit] = useState(config.limit);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!siren.trim()) return;

        onNewScan({
            ...config,
            rootSiren: siren.replace(/\s/g, ''),
            maxDepth: depth,
            limit
        });
    };

    const handleBackToLanding = () => {
        if (window.confirm(t.common.confirmReturn)) {
            window.location.reload();
        }
    };

    return (
        <header className="glass-light sticky top-0 z-20 border-b border-white/5">
            <div className="px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                    {/* Logo */}
                    <button
                        onClick={handleBackToLanding}
                        className="flex items-center gap-3 flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
                        title={t.header.returnToLanding}
                    >
                        <img
                            src="https://static.homunity.com/1.2.10/img/logo.svg"
                            alt="Homunity"
                            className="h-8 brightness-0 invert"
                        />
                    </button>

                    {/* Compact Controls - Desktop */}
                    <form onSubmit={handleSubmit} className="hidden lg:flex items-center gap-3 flex-1 max-w-2xl">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-glow/70" />
                            <input
                                type="text"
                                value={siren}
                                onChange={(e) => setSiren(e.target.value)}
                                placeholder="SIREN"
                                className="w-full pl-9 pr-3 py-2 cyber-input rounded-lg text-sm"
                            />
                        </div>

                        <div className="flex items-center gap-2 glass rounded-lg px-3 py-2">
                            <Layers className="w-4 h-4 text-cyber-purple" />
                            <input
                                type="range"
                                min="1"
                                max="4"
                                value={depth}
                                onChange={(e) => setDepth(parseInt(e.target.value))}
                                className="w-16"
                            />
                            <span className="text-sm font-bold text-cyber-glow w-4">{depth}</span>
                        </div>

                        <div className="flex items-center gap-2 glass rounded-lg px-3 py-2">
                            <Hash className="w-4 h-4 text-cyber-pink" />
                            <input
                                type="number"
                                min="10"
                                max="500"
                                value={limit}
                                onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
                                className="w-16 bg-transparent border-none text-sm text-white text-center focus:outline-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !siren.trim()}
                            className="px-4 py-2 cyber-btn rounded-lg text-white text-sm font-medium flex items-center gap-2"
                        >
                            <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            {isLoading ? t.header.scanning : t.header.rescan}
                        </button>

                        {isLoading && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-3 py-2 rounded-lg text-cyber-danger text-sm font-medium border border-cyber-danger/30 hover:bg-cyber-danger/10 transition-colors"
                            >
                                {t.header.stop}
                            </button>
                        )}
                    </form>

                    {/* Stats Summary */}
                    <div className="hidden md:flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-cyber-glow" />
                            <span className="text-slate-400">{t.header.companies}:</span>
                            <span className="font-mono text-white">{stats.companiesScanned}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500">
                            <span>|</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400">{t.header.people}:</span>
                            <span className="font-mono text-white">{stats.peopleFound}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500">
                            <span>|</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400">{t.header.links}:</span>
                            <span className="font-mono text-white">{stats.linksFound}</span>
                        </div>
                    </div>

                    {/* Language Switcher */}
                    <div className="hidden md:block">
                        <LanguageSwitcher />
                    </div>

                    {/* Mobile Toggle */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="lg:hidden p-2 rounded-lg glass hover:bg-white/5 transition-colors"
                    >
                        {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                    </button>
                </div>

                {/* Mobile Expanded Controls */}
                {isExpanded && (
                    <form onSubmit={handleSubmit} className="lg:hidden mt-4 space-y-3 animate-fade-in">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-glow/70" />
                            <input
                                type="text"
                                value={siren}
                                onChange={(e) => setSiren(e.target.value)}
                                placeholder="SIREN"
                                className="w-full pl-9 pr-3 py-2 cyber-input rounded-lg text-sm"
                            />
                        </div>

                        <div className="flex gap-3">
                            <div className="flex-1 flex items-center gap-2 glass rounded-lg px-3 py-2">
                                <Layers className="w-4 h-4 text-cyber-purple" />
                                <input
                                    type="range"
                                    min="1"
                                    max="4"
                                    value={depth}
                                    onChange={(e) => setDepth(parseInt(e.target.value))}
                                    className="flex-1"
                                />
                                <span className="text-sm font-bold text-cyber-glow">{depth}</span>
                            </div>

                            <div className="flex items-center gap-2 glass rounded-lg px-3 py-2">
                                <Hash className="w-4 h-4 text-cyber-pink" />
                                <input
                                    type="number"
                                    min="10"
                                    max="500"
                                    value={limit}
                                    onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
                                    className="w-16 bg-transparent border-none text-sm text-white text-center focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={isLoading || !siren.trim()}
                                className="flex-1 py-2 cyber-btn rounded-lg text-white text-sm font-medium flex items-center justify-center gap-2"
                            >
                                <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                {isLoading ? 'Scanning...' : 'Rescan'}
                            </button>

                            {isLoading && (
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="px-4 py-2 rounded-lg text-cyber-danger text-sm font-medium border border-cyber-danger/30 hover:bg-cyber-danger/10"
                                >
                                    Stop
                                </button>
                            )}
                        </div>

                        {/* Mobile Stats */}
                        <div className="flex justify-around text-xs text-slate-400 pt-2 border-t border-white/5">
                            <span>Companies: <span className="text-white font-mono">{stats.companiesScanned}</span></span>
                            <span>People: <span className="text-white font-mono">{stats.peopleFound}</span></span>
                            <span>Links: <span className="text-white font-mono">{stats.linksFound}</span></span>
                        </div>
                    </form>
                )}
            </div>
        </header>
    );
};

export default ResultsHeader;
