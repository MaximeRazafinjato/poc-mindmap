import { useCallback, useRef, useImperativeHandle, forwardRef, useEffect, useState } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import type { GraphData, GraphNode, GraphLink } from '@/types';
import { NODE_CONFIG, GRAPH_CONFIG } from '@/constants/config';

const TRANSITION_CONFIG = {
  zoomToDuration: 400,
  zoomOutDuration: 300,
  fitDuration: 600,
  fitPadding: 40,
  zoomInScale: 2.5,
};

interface GraphViewerProps {
  graphData: GraphData;
  centerNodeId: string;
  onNodeClick: (node: GraphNode) => void;
  isTransitioning?: boolean;
}

export interface GraphViewerRef {
  zoomToNode: (node: GraphNode) => Promise<void>;
  fitGraph: () => void;
}

export const GraphViewer = forwardRef<GraphViewerRef, GraphViewerProps>(
  function GraphViewer({ graphData, centerNodeId, onNodeClick, isTransitioning }, ref) {
  const graphRef = useRef<ForceGraphMethods<GraphNode>>();
  const [isAnimating, setIsAnimating] = useState(false);

  useImperativeHandle(ref, () => ({
    zoomToNode: async (node: GraphNode) => {
      if (!graphRef.current || !node.x || !node.y) return;
      setIsAnimating(true);
      graphRef.current.centerAt(node.x, node.y, TRANSITION_CONFIG.zoomToDuration);
      graphRef.current.zoom(TRANSITION_CONFIG.zoomInScale, TRANSITION_CONFIG.zoomToDuration);
      await new Promise(resolve => setTimeout(resolve, TRANSITION_CONFIG.zoomToDuration));
    },
    fitGraph: () => {
      if (!graphRef.current) return;
      graphRef.current.zoomToFit(TRANSITION_CONFIG.fitDuration, TRANSITION_CONFIG.fitPadding);
      setTimeout(() => setIsAnimating(false), TRANSITION_CONFIG.fitDuration);
    },
  }));

  useEffect(() => {
    if (!isTransitioning && graphRef.current && graphData.nodes.length > 0) {
      const timer = setTimeout(() => {
        graphRef.current?.zoomToFit(TRANSITION_CONFIG.fitDuration, TRANSITION_CONFIG.fitPadding);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [centerNodeId, isTransitioning, graphData.nodes.length]);


  const paintNode = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D) => {
    const isCenter = node.id === centerNodeId;
    const depth = node.depth ?? 1;
    const config = NODE_CONFIG[node.type];

    const depthSizeFactors = [1, 1, 0.7, 0.55, 0.45, 0.4];
    const depthOpacityFactors = [1, 0.9, 0.6, 0.45, 0.35, 0.3];
    const clampedDepth = Math.min(depth, depthSizeFactors.length - 1);

    const sizeByDepth = isCenter
      ? config.size * NODE_CONFIG.center.sizeMultiplier
      : config.size * depthSizeFactors[clampedDepth];

    const finalOpacity = isCenter ? 1 : depthOpacityFactors[clampedDepth];

    if (isCenter) {
      ctx.strokeStyle = NODE_CONFIG.center.strokeColor;
      ctx.lineWidth = NODE_CONFIG.center.strokeWidth;

      if (config.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, sizeByDepth + 2, 0, 2 * Math.PI);
        ctx.stroke();
      } else {
        ctx.strokeRect(node.x! - sizeByDepth - 2, node.y! - sizeByDepth - 2, (sizeByDepth + 2) * 2, (sizeByDepth + 2) * 2);
      }
    }

    ctx.globalAlpha = finalOpacity;
    ctx.fillStyle = config.color;

    if (config.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, sizeByDepth, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      ctx.fillRect(node.x! - sizeByDepth, node.y! - sizeByDepth, sizeByDepth * 2, sizeByDepth * 2);
    }

    const fontSizeByDepth = [4, 3.5, 2.5, 2, 1.8, 1.6];
    const maxCharsByDepth = [40, 35, 25, 20, 15, 12];
    const fontSize = isCenter ? 4 : fontSizeByDepth[clampedDepth];
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#64748b';
    ctx.globalAlpha = finalOpacity;

    const maxChars = isCenter ? 40 : maxCharsByDepth[clampedDepth];
    const name = node.name.length > maxChars ? node.name.substring(0, maxChars) + '..' : node.name;
    ctx.fillText(name, node.x!, node.y! + sizeByDepth + 1);

    ctx.globalAlpha = 1;
  }, [centerNodeId]);

  const paintLink = useCallback((link: GraphLink, ctx: CanvasRenderingContext2D) => {
    const source = link.source as GraphNode;
    const target = link.target as GraphNode;

    if (!source.x || !source.y || !target.x || !target.y) return;

    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.strokeStyle = GRAPH_CONFIG.linkColor;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = GRAPH_CONFIG.linkWidth;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }, []);

  const handleNodeClick = useCallback((node: GraphNode) => {
    onNodeClick(node);
  }, [onNodeClick]);

  if (graphData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        Sélectionnez un pôle pour afficher le graphe
      </div>
    );
  }

  return (
    <div
      className="w-full h-full transition-opacity duration-300"
      style={{ opacity: isTransitioning ? 0.3 : 1 }}
    >
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeId="id"
        nodeCanvasObject={paintNode}
        linkCanvasObject={paintLink}
        nodePointerAreaPaint={(node, color, ctx) => {
          const size = node.id === centerNodeId
            ? NODE_CONFIG[node.type].size * NODE_CONFIG.center.sizeMultiplier
            : NODE_CONFIG[node.type].size;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, size + 5, 0, 2 * Math.PI);
          ctx.fill();
        }}
        onNodeClick={isAnimating || isTransitioning ? undefined : handleNodeClick}
        backgroundColor={GRAPH_CONFIG.backgroundColor}
        warmupTicks={GRAPH_CONFIG.warmupTicks}
        cooldownTime={GRAPH_CONFIG.cooldownTime}
        enableNodeDrag={false}
      />
    </div>
  );
});
