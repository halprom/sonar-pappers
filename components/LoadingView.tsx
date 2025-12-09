import React, { useState, useEffect } from 'react';
import { Radar, Zap, Database, Network, Check } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface LoadingViewProps {
    progress?: number;
}

const LoadingView: React.FC<LoadingViewProps> = ({ progress }) => {
    const { t } = useLanguage();
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    const statusMessages = [
        { text: t.loading.connecting, icon: Zap },
        { text: t.loading.fetching, icon: Database },
        { text: t.loading.calculating, icon: Network },
        { text: t.loading.mapping, icon: Radar },
        { text: t.loading.analyzing, icon: Check },
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentMessageIndex((prev) => (prev + 1) % statusMessages.length);
        }, 2000);

        return () => clearInterval(interval);
    }, [statusMessages.length]);

    const CurrentIcon = statusMessages[currentMessageIndex].icon;

    return (
        <div className="flex flex-col items-center justify-center animate-fade-in">
            {/* Radar Animation Container */}
            <div className="radar-container mb-8">
                <div className="radar-circle"></div>
                <div className="radar-circle"></div>
                <div className="radar-circle"></div>
                <div className="radar-circle"></div>
                <div className="radar-dot"></div>
            </div>

            {/* Status Text */}
            <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <CurrentIcon className="w-6 h-6 text-cyber-glow animate-pulse" />
                    <span className="text-xl font-medium text-white glow-text">
                        {statusMessages[currentMessageIndex].text}
                    </span>
                </div>

                {/* Status dots */}
                <div className="flex items-center justify-center gap-2 mt-6">
                    {statusMessages.map((_, idx) => (
                        <div
                            key={idx}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentMessageIndex
                                ? 'bg-cyber-glow scale-125 shadow-lg shadow-cyber-glow/50'
                                : idx < currentMessageIndex
                                    ? 'bg-cyber-glow/50'
                                    : 'bg-slate-600'
                                }`}
                        />
                    ))}
                </div>

                {/* Optional progress indicator */}
                {progress !== undefined && (
                    <div className="mt-6 w-64">
                        <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-cyber-primary to-cyber-glow transition-all duration-300"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">{Math.round(progress)}{t.loading.complete}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoadingView;

