import React from 'react';
import { GraphNode, GraphLink, NodeType } from '../types';
import { User, Building, AlertTriangle, ExternalLink } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface DirectorsTableProps {
    nodes: GraphNode[];
    links: GraphLink[];
    onNodeClick?: (node: GraphNode) => void;
}

interface DirectorWithProcedures {
    director: GraphNode;
    companiesWithProcedures: GraphNode[];
}

const DirectorsTable: React.FC<DirectorsTableProps> = ({ nodes, links, onNodeClick }) => {
    const { t } = useLanguage();

    // Find all physical persons linked to companies with procedures collectives
    const getDirectorsWithProcedures = (): DirectorWithProcedures[] => {
        const result: DirectorWithProcedures[] = [];

        // Get all physical persons
        const persons = nodes.filter(n => n.type === NodeType.PERSON);

        // Get all companies with procedures
        const companiesWithProc = nodes.filter(n =>
            (n.type === NodeType.COMPANY || n.type === NodeType.ROOT) &&
            n.data?.procedures_collectives &&
            n.data.procedures_collectives.length > 0
        );

        // For each person, find if they're linked to any company with procedures
        for (const person of persons) {
            const linkedCompaniesWithProc: GraphNode[] = [];

            // Check all links where this person is involved
            for (const link of links) {
                const sourceId = typeof link.source === 'object' ? (link.source as any).id : link.source;
                const targetId = typeof link.target === 'object' ? (link.target as any).id : link.target;

                // If person is source (director -> company)
                if (sourceId === person.id) {
                    const company = companiesWithProc.find(c => c.id === targetId);
                    if (company && !linkedCompaniesWithProc.find(c => c.id === company.id)) {
                        linkedCompaniesWithProc.push(company);
                    }
                }

                // If person is target (company -> director, less common but check anyway)
                if (targetId === person.id) {
                    const company = companiesWithProc.find(c => c.id === sourceId);
                    if (company && !linkedCompaniesWithProc.find(c => c.id === company.id)) {
                        linkedCompaniesWithProc.push(company);
                    }
                }
            }

            // Only include directors with at least one company with procedures
            if (linkedCompaniesWithProc.length > 0) {
                result.push({
                    director: person,
                    companiesWithProcedures: linkedCompaniesWithProc
                });
            }
        }

        return result;
    };

    const directorsWithProcedures = getDirectorsWithProcedures();

    if (directorsWithProcedures.length === 0) {
        return (
            <div className="p-8 text-center glass h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-cyber-success/10 flex items-center justify-center mb-4">
                    <User className="w-8 h-8 text-cyber-success" />
                </div>
                <p className="text-cyber-success font-medium mb-2">Aucun dirigeant à risque</p>
                <p className="text-slate-500 text-sm">Aucun dirigeant n'est lié à une entreprise avec procédure collective</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full glass rounded-xl overflow-hidden border border-white/5">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-white flex items-center gap-2">
                        <User className="w-4 h-4 text-cyber-danger" />
                        {t.tabs.directors}
                    </h3>
                    <p className="text-xs text-slate-500">Dirigeants liés à des entreprises avec procédures collectives</p>
                </div>
                <div className="px-3 py-1 rounded-full bg-cyber-danger/20 text-cyber-danger text-sm font-medium">
                    {directorsWithProcedures.length} {directorsWithProcedures.length > 1 ? 'dirigeants' : 'dirigeant'}
                </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar p-4 space-y-4">
                {directorsWithProcedures.map((item, idx) => (
                    <div
                        key={idx}
                        className="glass p-4 rounded-lg border border-white/5 hover:border-cyber-danger/30 transition-colors cursor-pointer"
                        onClick={() => onNodeClick?.(item.director)}
                    >
                        {/* Director Info */}
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-cyber-danger/20 flex items-center justify-center">
                                <User className="w-5 h-5 text-cyber-danger" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-white">{item.director.label}</h4>
                                <p className="text-xs text-slate-500">
                                    {item.companiesWithProcedures.length} entreprise{item.companiesWithProcedures.length > 1 ? 's' : ''} avec procédure
                                </p>
                            </div>
                        </div>

                        {/* Companies with Procedures */}
                        <div className="space-y-2 pl-13">
                            {item.companiesWithProcedures.map((company, cIdx) => (
                                <div
                                    key={cIdx}
                                    className="flex items-start gap-2 p-2 rounded bg-cyber-dark/50 border border-white/5"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onNodeClick?.(company);
                                    }}
                                >
                                    <Building className="w-4 h-4 text-cyber-danger mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-white text-sm truncate">{company.label}</span>
                                            <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${company.status === 'active'
                                                    ? 'bg-cyber-success/20 text-cyber-success'
                                                    : 'bg-slate-600/20 text-slate-500'
                                                }`}>
                                                {company.status === 'active' ? 'Actif' : 'Radié'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-500 font-mono">{company.id}</div>

                                        {/* Procedures */}
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {company.data?.procedures_collectives?.map((pc: any, pcIdx: number) => (
                                                <span
                                                    key={pcIdx}
                                                    className="px-1.5 py-0.5 text-xs rounded bg-cyber-danger/20 text-cyber-danger border border-cyber-danger/30"
                                                >
                                                    {pc.type} ({pc.date_debut})
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <a
                                        href={`https://www.pappers.fr/entreprise/${company.id}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-cyber-glow hover:text-white transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DirectorsTable;
