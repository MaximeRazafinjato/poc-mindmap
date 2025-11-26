import { useCallback, useRef, useEffect } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import type { GraphData, GraphNode } from '@/types';
import { NODE_CONFIG, GRAPH_CONFIG } from '@/constants/config';

interface GraphViewerProps {
  graphData: GraphData;
  centerNodeId: string;
  onNodeClick: (node: GraphNode) => void;
}

export function GraphViewer({ graphData, centerNodeId, onNodeClick }: GraphViewerProps) {
  const graphRef = useRef<ForceGraphMethods<GraphNode>>();

  useEffect(() => {
    if (graphRef.current && graphData.nodes.length > 0) {
      setTimeout(() => {
        graphRef.current?.zoomToFit(400, 50);
      }, 500);
    }
  }, [centerNodeId, graphData.nodes.length]);

  const paintNode = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D) => {
    const isCenter = node.id === centerNodeId;
    const depth = node.depth ?? 1;
    const config = NODE_CONFIG[node.type];

    const sizeByDepth = isCenter ? config.size * NODE_CONFIG.center.sizeMultiplier
      : depth === 1 ? config.size
      : config.size * 0.6;

    const opacityByDepth = isCenter ? 1 : depth === 1 ? 0.9 : 0.5;

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

    ctx.globalAlpha = opacityByDepth;
    ctx.fillStyle = config.color;

    if (config.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, sizeByDepth, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      ctx.fillRect(node.x! - sizeByDepth, node.y! - sizeByDepth, sizeByDepth * 2, sizeByDepth * 2);
    }

    const fontSize = isCenter ? 4 : depth === 1 ? 3 : 2;
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#64748b';

    const maxChars = isCenter ? 40 : depth === 1 ? 30 : 20;
    const name = node.name.length > maxChars ? node.name.substring(0, maxChars) + '..' : node.name;
    ctx.fillText(name, node.x!, node.y! + sizeByDepth + 1);

    ctx.globalAlpha = 1;
  }, [centerNodeId]);

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
    <ForceGraph2D
      ref={graphRef}
      graphData={graphData}
      nodeId="id"
      nodeCanvasObject={paintNode}
      nodePointerAreaPaint={(node, color, ctx) => {
        const size = node.id === centerNodeId
          ? NODE_CONFIG[node.type].size * NODE_CONFIG.center.sizeMultiplier
          : NODE_CONFIG[node.type].size;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, size + 5, 0, 2 * Math.PI);
        ctx.fill();
      }}
      onNodeClick={handleNodeClick}
      linkColor={() => GRAPH_CONFIG.linkColor}
      linkWidth={GRAPH_CONFIG.linkWidth}
      backgroundColor={GRAPH_CONFIG.backgroundColor}
      warmupTicks={GRAPH_CONFIG.warmupTicks}
      cooldownTime={GRAPH_CONFIG.cooldownTime}
      enableNodeDrag={false}
    />
  );
}
