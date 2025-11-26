import { useState, useEffect, useRef, useCallback } from 'react';
import type { GraphData, GraphNode, GraphLink } from '@/types';

const TRANSITION_DURATION = 400;

interface TransitionState {
  nodes: GraphNode[];
  links: GraphLink[];
}

export function useGraphTransition(targetGraphData: GraphData): GraphData {
  const [displayData, setDisplayData] = useState<TransitionState>({ nodes: [], links: [] });
  const previousNodesRef = useRef<Map<string, GraphNode>>(new Map());
  const previousLinksRef = useRef<GraphLink[]>([]);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const isFirstRenderRef = useRef(true);

  const animate = useCallback((
    enteringNodes: GraphNode[],
    exitingNodes: GraphNode[],
    stayingNodes: GraphNode[],
    targetLinks: GraphLink[],
    exitingLinks: GraphLink[]
  ) => {
    startTimeRef.current = performance.now();

    const runAnimation = () => {
      const elapsed = performance.now() - startTimeRef.current;
      const progress = Math.min(elapsed / TRANSITION_DURATION, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const animatedNodes: GraphNode[] = [];

      for (const node of stayingNodes) {
        animatedNodes.push({ ...node, opacity: 1 });
      }

      for (const node of enteringNodes) {
        animatedNodes.push({ ...node, opacity: easeProgress });
      }

      for (const node of exitingNodes) {
        if (1 - easeProgress > 0.01) {
          animatedNodes.push({ ...node, opacity: 1 - easeProgress, isExiting: true });
        }
      }

      const animatedLinks: GraphLink[] = [];
      const nodeMap = new Map(animatedNodes.map(n => [n.id, n]));

      for (const link of targetLinks) {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        
        const sourceNode = nodeMap.get(sourceId);
        const targetNode = nodeMap.get(targetId);
        
        if (sourceNode && targetNode) {
          const linkOpacity = Math.min(sourceNode.opacity ?? 1, targetNode.opacity ?? 1);
          animatedLinks.push({ ...link, opacity: linkOpacity });
        }
      }

      for (const link of exitingLinks) {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        
        const sourceNode = nodeMap.get(sourceId);
        const targetNode = nodeMap.get(targetId);
        
        if (sourceNode && targetNode) {
          const alreadyExists = animatedLinks.some(l => {
            const lSourceId = typeof l.source === 'string' ? l.source : l.source.id;
            const lTargetId = typeof l.target === 'string' ? l.target : l.target.id;
            return (lSourceId === sourceId && lTargetId === targetId) || 
                   (lSourceId === targetId && lTargetId === sourceId);
          });
          
          if (!alreadyExists) {
            const linkOpacity = Math.min(sourceNode.opacity ?? 1, targetNode.opacity ?? 1);
            animatedLinks.push({ ...link, opacity: linkOpacity });
          }
        }
      }

      setDisplayData({ nodes: animatedNodes, links: animatedLinks });

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(runAnimation);
      } else {
        const finalNodes = [...stayingNodes, ...enteringNodes].map(n => ({ ...n, opacity: 1 }));
        setDisplayData({ nodes: finalNodes, links: targetLinks });
        
        previousNodesRef.current.clear();
        for (const node of finalNodes) {
          previousNodesRef.current.set(node.id, node);
        }
        previousLinksRef.current = targetLinks;
      }
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(runAnimation);
  }, []);

  useEffect(() => {
    if (targetGraphData.nodes.length === 0) {
      if (previousNodesRef.current.size > 0) {
        const exitingNodes = Array.from(previousNodesRef.current.values()).map(n => ({ ...n, isExiting: true }));
        animate([], exitingNodes, [], [], previousLinksRef.current);
      }
      return;
    }

    if (isFirstRenderRef.current && targetGraphData.nodes.length > 0) {
      isFirstRenderRef.current = false;
      const enteringNodes = targetGraphData.nodes.map(n => ({ ...n, opacity: 0 }));
      animate(enteringNodes, [], [], targetGraphData.links, []);
      return;
    }

    const targetNodeIds = new Set(targetGraphData.nodes.map(n => n.id));
    const previousNodeIds = new Set(previousNodesRef.current.keys());

    const enteringNodes: GraphNode[] = [];
    const exitingNodes: GraphNode[] = [];
    const stayingNodes: GraphNode[] = [];

    for (const node of targetGraphData.nodes) {
      if (previousNodeIds.has(node.id)) {
        const prevNode = previousNodesRef.current.get(node.id)!;
        stayingNodes.push({
          ...node,
          x: prevNode.x,
          y: prevNode.y,
        });
      } else {
        enteringNodes.push({ ...node, opacity: 0 });
      }
    }

    for (const [id, node] of previousNodesRef.current) {
      if (!targetNodeIds.has(id)) {
        exitingNodes.push({ ...node, isExiting: true });
      }
    }

    const exitingNodeIds = new Set(exitingNodes.map(n => n.id));
    const exitingLinks = previousLinksRef.current.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      return exitingNodeIds.has(sourceId) || exitingNodeIds.has(targetId);
    });

    if (enteringNodes.length === 0 && exitingNodes.length === 0 && stayingNodes.length > 0) {
      setDisplayData(targetGraphData);
      previousLinksRef.current = targetGraphData.links;
      return;
    }

    animate(enteringNodes, exitingNodes, stayingNodes, targetGraphData.links, exitingLinks);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetGraphData, animate]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return displayData;
}
