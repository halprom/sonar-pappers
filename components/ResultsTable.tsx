import React from 'react';
import { GraphLink, GraphNode, NodeType } from '../types';
import { ArrowRight, User, Building, GitFork, ExternalLink } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface ResultsTableProps {
  nodes: GraphNode[];
  links: GraphLink[];
  onNodeClick: (node: GraphNode) => void;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ nodes, links, onNodeClick }) => {
  const { t } = useLanguage();

  if (nodes.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 glass h-full flex items-center justify-center">
        {t.table.noData}
      </div>
    );
  }

  // Helper to find the path for a given node
  const getPathForNode = (nodeId: string) => {
    // 1. Try to find a link where this node is the target
    let link = links.find(l => {
      const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;
      return targetId === nodeId;
    });

    // 2. If not found, it might be a root or a source node in some specific cases
    // But for the table, we usually want to show how we got here. 
    // If it's the root node, it won't have a path to it.

    return link?.path || [];
  };

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
              <th className="px-6 py-3 text-xs font-semibold text-cyber-glow uppercase tracking-wider">Entity</th>
              <th className="px-6 py-3 text-xs font-semibold text-cyber-glow uppercase tracking-wider">{t.table.pathFromRoot}</th>
              <th className="px-6 py-3 text-xs font-semibold text-cyber-glow uppercase tracking-wider">SIREN</th>
              <th className="px-6 py-3 text-xs font-semibold text-cyber-glow uppercase tracking-wider">Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {nodes.map((node) => {
              const path = getPathForNode(node.id);

              return (
                <tr
                  key={node.id}
                  className="hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => onNodeClick(node)}
                >
                  {/* Column 1: Entity Name */}
                  <td className="px-6 py-4 text-sm text-slate-300">
                    <div className="flex items-center gap-2">
                      {node.type === NodeType.PERSON ? (
                        <User className="w-4 h-4 text-cyber-glow" />
                      ) : (
                        <Building className="w-4 h-4 text-cyber-primary" />
                      )}
                      <span className="font-medium text-white">{node.label}</span>
                    </div>
                  </td>

                  {/* Column 2: Path from Root */}
                  <td className="px-6 py-4 text-xs text-slate-500 max-w-xs">
                    <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap custom-scrollbar pb-1">
                      <GitFork className="w-3 h-3 flex-shrink-0 text-cyber-purple mr-1" />
                      {path.length > 0 ? (
                        path.map((step, i) => {
                          const stepName = typeof step === 'string' ? step : step.name;
                          return (
                            <React.Fragment key={i}>
                              {i > 0 && <span className="text-cyber-glow">→</span>}
                              <span className={i === 0 ? "font-semibold text-white" : "text-slate-400"}>{stepName}</span>
                            </React.Fragment>
                          );
                        })
                      ) : (
                        <span className="italic text-slate-600">{node.type === NodeType.ROOT ? "Root Entity" : t.table.direct}</span>
                      )}
                    </div>
                  </td>

                  {/* Column 3: SIREN */}
                  <td className="px-6 py-4 text-sm text-slate-300 font-mono">
                    {node.type === NodeType.COMPANY || node.type === NodeType.ROOT ? node.id : '-'}
                  </td>

                  {/* Column 4: Pappers Link */}
                  <td className="px-6 py-4 text-sm">
                    {node.type === NodeType.COMPANY || node.type === NodeType.ROOT ? (
                      <a
                        href={`https://www.pappers.fr/entreprise/${node.id}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()} // Prevent row click when clicking link
                        className="text-cyber-glow hover:text-white transition-colors flex items-center gap-1"
                      >
                        Pappers <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
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
