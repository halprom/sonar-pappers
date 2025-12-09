import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GraphNode, GraphLink, NodeType } from '../types';
import { COLORS } from '../constants';
import { GitBranch } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface OrgChartProps {
    nodes: GraphNode[];
    links: GraphLink[];
    onNodeClick: (node: GraphNode) => void;
}

// Build a tree structure from nodes/links
interface TreeNode {
    id: string;
    label: string;
    type: NodeType;
    status: string;
    hasProcedures: boolean;
    data: any;
    children: TreeNode[];
}

const OrgChart: React.FC<OrgChartProps> = ({ nodes, links, onNodeClick }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const { t } = useLanguage();

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                });
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Build tree from nodes/links
    const buildTree = (): TreeNode | null => {
        // Filter to only companies
        const companies = nodes.filter(n => n.type === NodeType.COMPANY || n.type === NodeType.ROOT);
        if (companies.length === 0) return null;

        // Find root
        const root = nodes.find(n => n.type === NodeType.ROOT);
        if (!root) return null;

        // Build adjacency map (parent -> children)
        const childrenMap = new Map<string, string[]>();

        // Process links where source is company and target is company
        for (const link of links) {
            // Get source/target IDs (handle D3 object refs)
            const sourceId = typeof link.source === 'object' ? (link.source as any).id : link.source;
            const targetId = typeof link.target === 'object' ? (link.target as any).id : link.target;

            // Check if both source and target are companies
            const sourceNode = nodes.find(n => n.id === sourceId);
            const targetNode = nodes.find(n => n.id === targetId);

            if (sourceNode && targetNode) {
                const sourceIsCompany = sourceNode.type === NodeType.COMPANY || sourceNode.type === NodeType.ROOT;
                const targetIsCompany = targetNode.type === NodeType.COMPANY;

                // Source company owns target company (entreprises_dirigees pattern)
                if (sourceIsCompany && targetIsCompany) {
                    if (!childrenMap.has(sourceId)) {
                        childrenMap.set(sourceId, []);
                    }
                    if (!childrenMap.get(sourceId)!.includes(targetId)) {
                        childrenMap.get(sourceId)!.push(targetId);
                    }
                }
            }
        }

        // Recursively build tree
        const buildNode = (nodeId: string, visited: Set<string>): TreeNode | null => {
            if (visited.has(nodeId)) return null;
            visited.add(nodeId);

            const node = nodes.find(n => n.id === nodeId);
            if (!node) return null;

            const hasProcedures = node.data?.procedures_collectives && node.data.procedures_collectives.length > 0;

            const treeNode: TreeNode = {
                id: node.id,
                label: node.label,
                type: node.type,
                status: node.status || 'active',
                hasProcedures,
                data: node.data,
                children: []
            };

            // Add children
            const childIds = childrenMap.get(nodeId) || [];
            for (const childId of childIds) {
                const childNode = buildNode(childId, visited);
                if (childNode) {
                    treeNode.children.push(childNode);
                }
            }

            return treeNode;
        };

        return buildNode(root.id, new Set());
    };

    // D3 Tree Rendering
    useEffect(() => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const treeData = buildTree();
        if (!treeData) return;

        const width = dimensions.width;
        const height = dimensions.height;
        const margin = { top: 40, right: 120, bottom: 40, left: 120 };

        // Create hierarchy
        const root = d3.hierarchy(treeData);

        // Tree layout - uses nodeSize for fixed spacing between nodes
        // [width, height] of the node slot
        // 150px width = 100px node + 50px gap
        // 120px height = 40px node + 80px vertical link
        const treeLayout = d3.tree<TreeNode>()
            .nodeSize([150, 120]);

        treeLayout(root);

        // Zoom behavior
        const g = svg.append("g");

        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 3])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });
        svg.call(zoom);

        // Initial transform - Center the root
        // With nodeSize, root is at (0,0). We shift it to center top.
        const initialTransform = d3.zoomIdentity
            .translate(width / 2, margin.top + 20)
            .scale(0.8); // Start slightly zoomed out to see structure via context

        svg.call(zoom.transform, initialTransform);

        // Glow filter
        const defs = svg.append("defs");
        const filter = defs.append("filter")
            .attr("id", "orgGlow")
            .attr("x", "-50%")
            .attr("y", "-50%")
            .attr("width", "200%")
            .attr("height", "200%");
        filter.append("feGaussianBlur")
            .attr("stdDeviation", "2")
            .attr("result", "coloredBlur");
        const feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode").attr("in", "coloredBlur");
        feMerge.append("feMergeNode").attr("in", "SourceGraphic");

        // Draw links (top-down orientation)
        g.selectAll(".link")
            .data(root.links())
            .enter()
            .append("path")
            .attr("class", "link")
            .attr("d", d => {
                return `M${d.source.x},${d.source.y}
                C${d.source.x},${(d.source.y + d.target.y) / 2}
                 ${d.target.x},${(d.source.y + d.target.y) / 2}
                 ${d.target.x},${d.target.y}`;
            })
            .attr("fill", "none")
            .attr("stroke", COLORS.accent)
            .attr("stroke-opacity", 0.6)
            .attr("stroke-width", 1.5);

        // Draw nodes (top-down orientation)
        const nodeGroup = g.selectAll(".node")
            .data(root.descendants())
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.x},${d.y})`)
            .style("cursor", "pointer")
            .on("click", (event, d) => {
                const originalNode = nodes.find(n => n.id === d.data.id);
                if (originalNode) onNodeClick(originalNode);
            });

        // Node rectangles with colors matching NetworkGraph
        nodeGroup.append("rect")
            .attr("x", -50)
            .attr("y", -20)
            .attr("width", 100)
            .attr("height", 40)
            .attr("rx", 6)
            .attr("fill", d => {
                if (d.data.type === NodeType.ROOT) return COLORS.nodeRoot;
                if (d.data.status === 'closed') return COLORS.nodeInactive;
                return COLORS.nodeCompany;
            })
            .attr("stroke", d => {
                if (d.data.hasProcedures) return COLORS.nodeProcedure;
                return COLORS.accent;
            })
            .attr("stroke-width", d => d.data.hasProcedures ? 3 : 2)
            .style("filter", "url(#orgGlow)");

        // Node labels
        nodeGroup.append("text")
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .attr("fill", "#fff")
            .attr("font-size", "10px")
            .text(d => {
                const label = d.data.label || '';
                return label.length > 14 ? label.substring(0, 12) + '...' : label;
            })
            .style("pointer-events", "none");

        // Status indicator (small dot)
        nodeGroup.append("circle")
            .attr("cx", 40)
            .attr("cy", -10)
            .attr("r", 4)
            .attr("fill", d => {
                if (d.data.hasProcedures) return COLORS.nodeProcedure;
                if (d.data.status === 'closed') return COLORS.nodeInactive;
                return COLORS.nodeCompany;
            });

    }, [nodes, links, dimensions, onNodeClick]);

    // Filter companies only for count
    const companyCount = nodes.filter(n => n.type === NodeType.COMPANY || n.type === NodeType.ROOT).length;

    if (companyCount === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 glass rounded-xl border border-white/5">
                <GitBranch className="w-12 h-12 mb-2 opacity-50 text-cyber-glow" />
                <p className="text-slate-400">Start a scan to view the organizational chart</p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative w-full h-full bg-cyber-dark rounded-xl overflow-hidden border border-white/5">
            <svg ref={svgRef} width="100%" height="100%" className="touch-none" />

            {/* Legend */}
            <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2 pointer-events-none">
                <div className="flex gap-3 glass p-3 rounded-lg pointer-events-auto text-xs">
                    <div className="flex items-center gap-2 text-slate-400">
                        <div className="w-3 h-3 rounded bg-cyber-purple shadow-lg shadow-cyber-purple/50"></div>
                        <span>Root</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                        <div className="w-3 h-3 rounded bg-cyber-primary shadow-lg shadow-cyber-primary/50"></div>
                        <span>Active</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                        <div className="w-3 h-3 rounded bg-slate-500"></div>
                        <span>Inactive</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                        <div className="w-3 h-3 rounded border-2 border-cyber-danger bg-cyber-primary"></div>
                        <span>Procedure</span>
                    </div>
                </div>
            </div>

            {/* Company count badge */}
            <div className="absolute top-4 left-4">
                <div className="glass px-3 py-1 rounded-full text-xs text-slate-300">
                    {companyCount} {companyCount > 1 ? 'companies' : 'company'}
                </div>
            </div>
        </div>
    );
};

export default OrgChart;
