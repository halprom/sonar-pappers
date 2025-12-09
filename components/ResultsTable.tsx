
import React from 'react';
import { GraphLink, GraphNode, NodeType } from '../types';
import { ArrowRight, User, Building, GitFork } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface ResultsTableProps {
  nodes: GraphNode[];
  links: GraphLink[];
}

const ResultsTable: React.FC<ResultsTableProps> = ({ nodes, links }) => {
  const { t } = useLanguage();

  if (nodes.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 glass h-full flex items-center justify-center">
        {t.table.noData}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full glass rounded-xl overflow-hidden border border-white/5">
      <div className="px-6 py-4 border-b border-white/5">
        <h3 className="font-semibold text-white">{t.table.title}</h3>
        <p className="text-xs text-slate-500">{t.table.subtitle}</p>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="glass-light sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-cyber-glow uppercase tracking-wider">{t.table.sourceEntity}</th>
              <th className="px-6 py-3 text-xs font-semibold text-cyber-glow uppercase tracking-wider">{t.table.role}</th>
              <th className="px-6 py-3 text-xs font-semibold text-cyber-glow uppercase tracking-wider">{t.table.targetEntity}</th>
              <th className="px-6 py-3 text-xs font-semibold text-cyber-glow uppercase tracking-wider">{t.table.pathFromRoot}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {links.map((link, idx) => {
              // Note: D3 might convert link.source to an object, handle both cases
              const sourceId = typeof link.source === 'object' ? (link.source as any).id : link.source;
              const targetId = typeof link.target === 'object' ? (link.target as any).id : link.target;

              const sourceNode = nodes.find(n => n.id === sourceId);
              const targetNode = nodes.find(n => n.id === targetId);

              return (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-300">
                    <div className="flex items-center gap-2">
                      {sourceNode?.type === NodeType.PERSON ? (
                        <User className="w-4 h-4 text-cyber-glow" />
                      ) : (
                        <Building className="w-4 h-4 text-cyber-primary" />
                      )}
                      <span className="font-medium text-white">{sourceNode?.label || sourceId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-400 glass-light px-3 py-1 rounded w-fit text-xs font-medium">
                      {link.label}
                      <ArrowRight className="w-3 h-3 text-cyber-glow" />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">
                    <div className="flex items-center gap-2">
                      {targetNode?.type === NodeType.PERSON ? (
                        <User className="w-4 h-4 text-cyber-glow" />
                      ) : (
                        <Building className="w-4 h-4 text-cyber-primary" />
                      )}
                      <span>{targetNode?.label || targetId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 max-w-xs">
                    <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap custom-scrollbar pb-1">
                      <GitFork className="w-3 h-3 flex-shrink-0 text-cyber-purple mr-1" />
                      {link.path && link.path.length > 0 ? (
                        link.path.map((step, i) => {
                          const stepName = typeof step === 'string' ? step : step.name;
                          return (
                            <React.Fragment key={i}>
                              {i > 0 && <span className="text-cyber-glow">→</span>}
                              <span className={i === 0 ? "font-semibold text-white" : "text-slate-400"}>{stepName}</span>
                            </React.Fragment>
                          );
                        })
                      ) : (
                        <span className="italic text-slate-600">{t.table.direct}</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsTable;
