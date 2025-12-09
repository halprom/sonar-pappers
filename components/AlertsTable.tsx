
import React from 'react';
import { GraphNode, GraphLink, NodeType } from '../types';
import { AlertTriangle, Building, ExternalLink, Calendar, GitFork } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface AlertsTableProps {
    nodes: GraphNode[];
    links: GraphLink[];
    onNodeClick?: (node: GraphNode) => void;
}

const AlertsTable: React.FC<AlertsTableProps> = ({ nodes, links, onNodeClick }) => {
    const { t } = useLanguage();

    // Filter to companies with collective procedures (using hasAlert flag OR data)
    const alertNodes = nodes.filter(node =>
        (node.type === NodeType.COMPANY || node.type === NodeType.ROOT) &&
        (node.hasAlert || (node.data?.procedures_collectives && node.data.procedures_collectives.length > 0))
    );

    // Helper to find path for a node
    const getPathForNode = (nodeId: string) => {
        // Find link where this node is the target
        let link = links.find(l => {
            const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;
            return targetId === nodeId;
        });

        // If not found as target, try as source
        if (!link) {
            link = links.find(l => {
                const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source;
                return sourceId === nodeId;
            });
        }

        return link?.path || [];
    };

    if (alertNodes.length === 0) {
        return (
            <div className="p-8 text-center glass h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-cyber-success/10 flex items-center justify-center mb-4">
                    <AlertTriangle className="w-8 h-8 text-cyber-success" />
                </div>
                <p className="text-cyber-success font-medium mb-2">{t.alerts.noAlerts}</p>
                <p className="text-slate-500 text-sm">{t.alerts.noAlertsSubtitle}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full glass rounded-xl overflow-hidden border border-white/5">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-white flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-cyber-danger" />
                        {t.alerts.title}
                    </h3>
                    <p className="text-xs text-slate-500">{t.alerts.subtitle}</p>
                </div>
                <div className="px-3 py-1 rounded-full bg-cyber-danger/20 text-cyber-danger text-sm font-medium">
                    {alertNodes.length} {alertNodes.length > 1 ? t.alerts.alertsCount : t.alerts.alertCount}
                </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="glass-light sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-cyber-glow uppercase tracking-wider">{t.alerts.company}</th>
                            <th className="px-6 py-3 text-xs font-semibold text-cyber-glow uppercase tracking-wider">{t.alerts.status}</th>
                            <th className="px-6 py-3 text-xs font-semibold text-cyber-glow uppercase tracking-wider">{t.alerts.procedures}</th>
                            <th className="px-6 py-3 text-xs font-semibold text-cyber-glow uppercase tracking-wider">{t.table.pathFromRoot}</th>
                            <th className="px-6 py-3 text-xs font-semibold text-cyber-glow uppercase tracking-wider">{t.alerts.actions}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {alertNodes.map((node, idx) => {
                            const path = getPathForNode(node.id);
                            return (
                                <tr
                                    key={idx}
                                    className="hover:bg-white/5 transition-colors cursor-pointer"
                                    onClick={() => onNodeClick?.(node)}
                                >
                                    <td className="px-6 py-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Building className="w-4 h-4 text-cyber-danger" />
                                            <div>
                                                <span className="font-medium text-white">{node.label}</span>
                                                <span className="block text-xs font-mono text-slate-500">{node.id}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${node.status === 'active'
                                            ? 'bg-cyber-success/20 text-cyber-success border border-cyber-success/30'
                                            : 'bg-slate-600/20 text-slate-500 border border-slate-600/30'
                                            }`}>
                                            {node.status === 'active' ? t.alerts.active : t.alerts.closed}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            {node.data.procedures_collectives.map((pc: any, pcIdx: number) => (
                                                <div key={pcIdx} className="flex items-center gap-2 text-xs">
                                                    <span className="px-2 py-0.5 rounded bg-cyber-danger/20 text-cyber-danger border border-cyber-danger/30">
                                                        {pc.type}
                                                    </span>
                                                    <span className="text-slate-500 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {pc.date_debut}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1 flex-wrap text-xs">
                                            {path.length > 0 ? (
                                                path.map((step, i) => {
                                                    const stepName = typeof step === 'string' ? step : step.name;
                                                    return (
                                                        <React.Fragment key={i}>
                                                            {i > 0 && <span className="text-cyber-glow">→</span>}
                                                            <span className={i === 0 ? "font-semibold text-white" : "text-slate-400"}>
                                                                {stepName.length > 15 ? stepName.substring(0, 13) + '...' : stepName}
                                                            </span>
                                                        </React.Fragment>
                                                    );
                                                })
                                            ) : (
                                                <span className="italic text-slate-600">{t.table.direct}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <a
                                            href={`https://www.pappers.fr/entreprise/${node.id}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex items-center gap-1 text-xs text-cyber-glow hover:text-white transition-colors"
                                        >
                                            Pappers <ExternalLink className="w-3 h-3" />
                                        </a>
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

export default AlertsTable;
