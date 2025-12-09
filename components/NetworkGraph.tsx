
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GraphNode, GraphLink, NodeType } from '../types';
import { COLORS } from '../constants';
import { Maximize } from 'lucide-react';

interface NetworkGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  onNodeClick: (node: GraphNode) => void;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({ nodes, links, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

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

  // D3 Logic
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    const width = dimensions.width;
    const height = dimensions.height;

    // Create a deep copy of data for D3 to mutate
    const d3Nodes = nodes.map(d => ({ ...d }));
    const d3Links = links.map(d => ({ ...d }));

    // Simulation Setup
    const simulation = d3.forceSimulation(d3Nodes as any)
      .force("link", d3.forceLink(d3Links).id((d: any) => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-800))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(60));

    // Zoom Behavior
    const g = svg.append("g");
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    svg.call(zoom);

    // Arrow markers - Cyberpunk style
    svg.append("defs").selectAll("marker")
      .data(["end"])
      .enter().append("marker")
      .attr("id", String)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 8)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", COLORS.accent);

    // Draw Links
    const link = g.append("g")
      .selectAll("line")
      .data(d3Links)
      .join("line")
      .attr("stroke", (d) => d.active ? COLORS.linkActive : COLORS.linkInactive)
      .attr("stroke-opacity", 0.8)
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#end)");

    // Draw Nodes
    const node = g.append("g")
      .selectAll("g")
      .data(d3Nodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(d3.drag<SVGGElement, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Node Shapes - Clean Minimalist Style
    node.each(function (d) {
      const el = d3.select(this);

      // Determine Styles
      const isRoot = d.type === NodeType.ROOT;
      const isPerson = d.type === NodeType.PERSON;
      const isInactive = d.status === 'closed';
      const hasProcedures = d.data?.procedures_collectives && d.data.procedures_collectives.length > 0;

      // Colors - Cyberpunk theme
      let baseFill = isPerson ? COLORS.background : COLORS.nodeCompany;
      if (isRoot) baseFill = COLORS.nodeRoot;
      if (isInactive && !isPerson) baseFill = COLORS.nodeInactive;

      // Stroke
      const strokeColor = hasProcedures ? COLORS.nodeProcedure : (isPerson ? COLORS.nodePerson : COLORS.accent);
      const strokeWidth = hasProcedures ? 3 : 2;

      // Glow filter
      if (!svg.select("#glow").node()) {
        const defs = svg.select("defs");
        const filter = defs.append("filter")
          .attr("id", "glow")
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
      }

      if (isPerson) {
        // Minimalist circle for persons
        el.append("circle")
          .attr("r", 16)
          .attr("fill", baseFill)
          .attr("stroke", strokeColor)
          .attr("stroke-width", strokeWidth)
          .style("filter", "url(#glow)");

        // Simple person icon - just a head dot and shoulders arc
        el.append("circle")
          .attr("cx", 0)
          .attr("cy", -3)
          .attr("r", 4)
          .attr("fill", strokeColor);

        el.append("path")
          .attr("d", "M-6,8 Q0,3 6,8")
          .attr("stroke", strokeColor)
          .attr("stroke-width", 1.5)
          .attr("fill", "none")
          .attr("stroke-linecap", "round");

      } else {
        // Minimalist rounded rectangle for companies
        const size = 32;

        el.append("rect")
          .attr("width", size)
          .attr("height", size)
          .attr("x", -size / 2)
          .attr("y", -size / 2)
          .attr("rx", 5)
          .attr("fill", baseFill)
          .attr("stroke", strokeColor)
          .attr("stroke-width", strokeWidth)
          .style("filter", "url(#glow)");

        if (isRoot) {
          // Root icon: Simple diamond
          el.append("path")
            .attr("d", "M0,-7 L7,0 L0,7 L-7,0 Z")
            .attr("fill", "#fff")
            .attr("opacity", 0.9);
        } else {
          // Company icon: Simple building shape
          el.append("rect")
            .attr("x", -5)
            .attr("y", -7)
            .attr("width", 10)
            .attr("height", 14)
            .attr("fill", isInactive ? "#666" : "#fff")
            .attr("opacity", 0.85);

          // Single window - ultra minimal
          el.append("rect")
            .attr("x", -2)
            .attr("y", -4)
            .attr("width", 4)
            .attr("height", 3)
            .attr("fill", strokeColor);
        }
      }
    });

    // Labels - Cyberpunk style with glow
    node.append("text")
      .attr("dx", 25)
      .attr("dy", 4)
      .text(d => d.label.length > 20 ? d.label.substring(0, 18) + '...' : d.label)
      .attr("font-size", "10px")
      .attr("fill", COLORS.textPrimary)
      .style("pointer-events", "none")
      .style("text-shadow", "0 0 8px rgba(0, 212, 255, 0.5)");

    // Click Interaction
    node.on("click", (event, d) => {
      const originalNode = nodes.find(n => n.id === d.id);
      if (originalNode) onNodeClick(originalNode);
    });

    // Simulation Tick
    simulation.on("tick", () => {
      link.attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => {
          const targetRadius = d.target.type === NodeType.PERSON ? 26 : 34;
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist === 0) return d.target.x;
          const offsetX = (dx * targetRadius) / dist;
          return d.target.x - offsetX;
        })
        .attr("y2", (d: any) => {
          const targetRadius = d.target.type === NodeType.PERSON ? 26 : 34;
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist === 0) return d.target.y;
          const offsetY = (dy * targetRadius) / dist;
          return d.target.y - offsetY;
        });

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [nodes, links, dimensions, onNodeClick]);

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 glass rounded-xl border border-white/5">
        <Maximize className="w-12 h-12 mb-2 opacity-50 text-cyber-glow" />
        <p className="text-slate-400">Start a scan to visualize the network</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-cyber-dark rounded-xl overflow-hidden border border-white/5">
      <svg ref={svgRef} width="100%" height="100%" className="touch-none" />

      {/* Legend - Cyberpunk style */}
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
    </div>
  );
};

export default NetworkGraph;
