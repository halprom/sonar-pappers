import React, { useState } from 'react';
import { Search, ShieldCheck, Info } from 'lucide-react';
import { CrawlConfig } from '../types';

interface ConfigFormProps {
  isLoading: boolean;
  onScan: (config: CrawlConfig) => void;
}

const ConfigForm: React.FC<ConfigFormProps> = ({ isLoading, onScan }) => {
  const [apiKey, setApiKey] = useState('');
  const [siren, setSiren] = useState('');
  const [depth, setDepth] = useState(2);
  const [limit, setLimit] = useState(100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siren) return;
    // Allow empty key for Demo Mode handled by service
    onScan({ apiKey: apiKey.trim() || 'DEMO', rootSiren: siren.replace(/\s/g, ''), maxDepth: depth, limit });
  };

  const handleDemoFill = () => {
    setSiren("443061841");
    setApiKey("DEMO");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            API Key (Pappers)
          </label>
          <div className="relative">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Pappers API Key"
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
            <ShieldCheck className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Leave empty to use <strong>Demo Mode</strong> (Mock Data)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Root SIREN
          </label>
          <div className="relative">
            <input
              type="text"
              value={siren}
              onChange={(e) => setSiren(e.target.value)}
              placeholder="e.g. 443 061 841"
              maxLength={11}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
          </div>
          <button 
            type="button" 
            onClick={handleDemoFill}
            className="text-xs text-blue-600 hover:text-blue-700 mt-1 font-medium"
          >
            Load Example (Google France)
          </button>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <label className="text-sm font-medium text-slate-700">Scan Depth</label>
            <span className="text-sm font-bold text-blue-600">Level {depth}</span>
          </div>
          <input
            type="range"
            min="1"
            max="4"
            step="1"
            value={depth}
            onChange={(e) => setDepth(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>Direct</span>
            <span>Deep</span>
          </div>
        </div>

        <div>
           <div className="flex justify-between mb-1">
            <label className="text-sm font-medium text-slate-700">Entity Limit</label>
             <span className="text-sm text-slate-500">{limit} max</span>
          </div>
          <input
            type="number"
            min="10"
            max="500"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !siren}
        className={`w-full py-3 px-4 rounded-lg text-white font-medium shadow-md transition-all
          ${isLoading || !siren 
            ? 'bg-slate-300 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:transform active:scale-95'
          }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Scanning Network...
          </span>
        ) : (
          "Launch Mapper"
        )}
      </button>
    </form>
  );
};

export default ConfigForm;