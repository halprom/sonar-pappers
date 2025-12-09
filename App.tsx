
import React, { useState, useRef } from 'react';
import { PappersCrawler } from './services/crawler';
import VantaBackground from './components/VantaBackground';
import LandingCard from './components/LandingCard';
import LoadingView from './components/LoadingView';
import ResultsHeader from './components/ResultsHeader';
import NetworkGraph from './components/NetworkGraph';
import ResultsTable from './components/ResultsTable';
import AlertsTable from './components/AlertsTable';
import OrgChart from './components/OrgChart';
import DirectorsTable from './components/DirectorsTable';
import { GraphNode, GraphLink, CrawlStats, CrawlConfig } from './types';
import { LayoutDashboard, Table as TableIcon, X, AlertTriangle, Info, GitFork, User } from 'lucide-react';
import { useLanguage } from './LanguageContext';

type AppView = 'landing' | 'loading' | 'results';

const App: React.FC = () => {
  const { t } = useLanguage();
  // View State
  const [currentView, setCurrentView] = useState<AppView>('landing');

  // Data State
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [config, setConfig] = useState<CrawlConfig>({
    apiKey: 'DEMO',
    rootSiren: '',
    maxDepth: 2,
    limit: 100
  });
  const [stats, setStats] = useState<CrawlStats>({
    companiesScanned: 0,
    peopleFound: 0,
    linksFound: 0,
    depthReached: 0,
    errors: [],
    creditsConsumed: 0
  });
  const [activeTab, setActiveTab] = useState<'graph' | 'table' | 'alerts' | 'orgChart' | 'directors'>('graph');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Crawler Reference
  const crawlerRef = useRef<PappersCrawler | null>(null);

  const handleLaunch = async (newConfig: CrawlConfig) => {
    setConfig(newConfig);
    setCurrentView('loading');
    setLoading(true);
    setNodes([]);
    setLinks([]);
    setSelectedNode(null);
    setStats({
      companiesScanned: 0,
      peopleFound: 0,
      linksFound: 0,
      depthReached: 0,
      errors: [],
      creditsConsumed: 0
    });

    const crawler = new PappersCrawler(newConfig.apiKey);
    crawlerRef.current = crawler;

    try {
      const result = await crawler.crawl(
        newConfig.rootSiren,
        newConfig.maxDepth,
        newConfig.limit,
        (progressStats) => {
          setStats(progressStats);
        }
      );

      setNodes(result.nodes);
      setLinks(result.links);
      setStats(result.stats);
      setCurrentView('results');
    } catch (error) {
      console.error("Scan failed", error);
      setCurrentView('landing');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (crawlerRef.current) {
      crawlerRef.current.cancel();
    }
    setLoading(false);
    setCurrentView('landing');
  };

  const handleNewScan = (newConfig: CrawlConfig) => {
    handleLaunch(newConfig);
  };

  return (
    <>
      {/* Vanta Background - active on landing and loading, paused on results */}
      <VantaBackground active={currentView !== 'results'} />

      {/* Landing View */}
      {currentView === 'landing' && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <LandingCard onLaunch={handleLaunch} />
        </div>
      )}

      {/* Loading View */}
      {currentView === 'loading' && (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <LoadingView />
          <button
            onClick={handleCancel}
            className="mt-8 px-6 py-2 rounded-lg text-cyber-danger text-sm font-medium border border-cyber-danger/30 hover:bg-cyber-danger/10 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Results View */}
      {currentView === 'results' && (
        <div className="min-h-screen flex flex-col bg-cyber-dark">
          <ResultsHeader
            config={config}
            stats={stats}
            isLoading={loading}
            onNewScan={handleNewScan}
            onCancel={handleCancel}
          />

          <main className="flex-1 flex overflow-hidden">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Tabs */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <TabButton
                  active={activeTab === 'graph'}
                  onClick={() => setActiveTab('graph')}
                  icon={<LayoutDashboard className="w-4 h-4" />}
                  label={t.tabs.networkGraph}
                />
                <TabButton
                  active={activeTab === 'table'}
                  onClick={() => setActiveTab('table')}
                  icon={<TableIcon className="w-4 h-4" />}
                  label={t.tabs.dataTable}
                />
                <TabButton
                  active={activeTab === 'alerts'}
                  onClick={() => setActiveTab('alerts')}
                  icon={<AlertTriangle className="w-4 h-4" />}
                  label={t.tabs.alertsTable}
                />
                <TabButton
                  active={activeTab === 'orgChart'}
                  onClick={() => setActiveTab('orgChart')}
                  icon={<GitFork className="w-4 h-4" />}
                  label={t.tabs.orgChart}
                />
                <TabButton
                  active={activeTab === 'directors'}
                  onClick={() => setActiveTab('directors')}
                  icon={<User className="w-4 h-4" />}
                  label={t.tabs.directors}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-h-0 relative">
                {activeTab === 'graph' && (
                  <NetworkGraph
                    nodes={nodes}
                    links={links}
                    onNodeClick={setSelectedNode}
                  />
                )}
                {activeTab === 'table' && (
                  <ResultsTable nodes={nodes} links={links} onNodeClick={setSelectedNode} />
                )}
                {activeTab === 'alerts' && (
                  <AlertsTable nodes={nodes} links={links} onNodeClick={setSelectedNode} />
                )}
                {activeTab === 'orgChart' && (
                  <OrgChart nodes={nodes} links={links} onNodeClick={setSelectedNode} />
                )}
                {activeTab === 'directors' && (
                  <DirectorsTable nodes={nodes} links={links} onNodeClick={setSelectedNode} />
                )}
              </div>
            </div>

            {/* Right Sidebar - Selected Node Details */}
            {selectedNode && (
              <aside className="w-80 border-l border-white/5 glass-light overflow-y-auto custom-scrollbar">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-white break-words pr-2 text-lg">{selectedNode.label}</h3>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="text-slate-500 hover:text-white transition-colors p-1 rounded hover:bg-white/5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 text-sm">
                    <DetailRow label={t.sidebar.id} value={selectedNode.id} mono />
                    <DetailRow label={t.sidebar.type} value={selectedNode.type} />

                    {selectedNode.type === 'COMPANY' && (
                      <DetailRow
                        label={t.sidebar.status}
                        value={
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${selectedNode.status === 'active'
                            ? 'bg-cyber-success/20 text-cyber-success'
                            : 'bg-slate-600/30 text-slate-400'
                            }`}>
                            {selectedNode.status === 'active' ? t.sidebar.activeStatus : t.sidebar.closedStatus}
                          </span>
                        }
                      />
                    )}

                    {selectedNode.data?.siege?.ville && (
                      <DetailRow label={t.sidebar.city} value={selectedNode.data.siege.ville} />
                    )}

                    {/* Path from Root */}
                    {(() => {
                      // Find link where this node is involved (as source or target) to get the path
                      let linkWithPath = links.find(l => {
                        const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;
                        return targetId === selectedNode.id;
                      });

                      // If not found as target, try finding where node is source (common for persons)
                      if (!linkWithPath || !linkWithPath.path || linkWithPath.path.length === 0) {
                        linkWithPath = links.find(l => {
                          const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source;
                          return sourceId === selectedNode.id;
                        });
                      }

                      if (linkWithPath && linkWithPath.path && linkWithPath.path.length > 0) {
                        const pathToShow = linkWithPath.path;

                        return (
                          <div className="mt-4 p-3 rounded-lg bg-cyber-purple/10 border border-cyber-purple/30">
                            <p className="font-semibold mb-3 flex items-center gap-1 text-cyber-purple text-xs">
                              <GitFork className="w-3 h-3" />
                              {t.sidebar.relationshipPath}
                            </p>
                            <div className="space-y-2 text-xs">
                              {pathToShow.map((step: any, idx: number) => {
                                const stepName = typeof step === 'string' ? step : step.name;
                                const stepRelation = typeof step === 'object' ? step.relationFromPrevious : null;
                                const stepType = typeof step === 'object' ? step.type : null;

                                return (
                                  <div key={idx} className="flex flex-col">
                                    {/* Show relationship arrow from previous entity */}
                                    {idx > 0 && stepRelation && (
                                      <div className="flex items-center gap-1 ml-2 mb-1 text-cyber-glow">
                                        <span className="text-slate-500">└─</span>
                                        <span className="italic text-[10px] bg-cyber-glow/10 px-1.5 py-0.5 rounded">
                                          {stepRelation}
                                        </span>
                                        <span>↓</span>
                                      </div>
                                    )}
                                    {/* Entity name */}
                                    <div className="flex items-center gap-2">
                                      {stepType === 'PERSON' ? (
                                        <span className="w-4 h-4 flex items-center justify-center text-cyber-glow text-[10px]">👤</span>
                                      ) : stepType === 'ROOT' ? (
                                        <span className="w-4 h-4 flex items-center justify-center text-cyber-pink text-[10px]">🏢</span>
                                      ) : (
                                        <span className="w-4 h-4 flex items-center justify-center text-cyber-primary text-[10px]">🏢</span>
                                      )}
                                      <span className={idx === 0 ? 'font-semibold text-white' : 'text-slate-300'}>
                                        {stepName}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Collective Procedures */}
                    {selectedNode.data?.procedures_collectives && selectedNode.data.procedures_collectives.length > 0 && (
                      <div className="mt-4 p-3 rounded-lg bg-cyber-danger/10 border border-cyber-danger/30">
                        <p className="font-semibold mb-2 flex items-center gap-1 text-cyber-danger">
                          <AlertTriangle className="w-3 h-3" />
                          {t.sidebar.collectiveProcedures}
                        </p>
                        <div className="space-y-1 text-xs">
                          {selectedNode.data.procedures_collectives.map((pc: any, idx: number) => (
                            <div key={idx} className="flex justify-between border-b border-cyber-danger/20 last:border-0 pb-1 last:pb-0">
                              <span className="text-slate-300">{pc.type}</span>
                              <span className="text-cyber-danger font-mono">{pc.date_debut}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <a
                      href={`https://www.pappers.fr/entreprise/${selectedNode.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block mt-4 text-xs text-cyber-glow hover:text-white transition-colors flex items-center gap-1"
                    >
                      {t.sidebar.viewOnPappers} <Info className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </aside>
            )}
          </main>
        </div>
      )}
    </>
  );
};

// Sub-components
const TabButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
      ${active
        ? 'glass text-cyber-glow glow-border'
        : 'text-slate-500 hover:text-white hover:bg-white/5'
      }`}
  >
    {icon}
    {label}
  </button>
);

const DetailRow = ({ label, value, mono = false }: { label: string, value: any, mono?: boolean }) => (
  <div className="flex items-start gap-2">
    <span className="text-slate-500 flex-shrink-0 w-16">{label}:</span>
    <span className={`text-slate-200 ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
  </div>
);

export default App;
