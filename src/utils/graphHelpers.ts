import type { Pole, Liaison, GraphNode, GraphData, AdjacencyMap, PolesIndex } from '@/types';
import { GRAPH_CONFIG } from '@/constants/config';

export function buildPolesIndex(poles: Pole[]): PolesIndex {
  const index = new Map<string, Pole>();
  for (const pole of poles) {
    index.set(pole.id, pole);
  }
  return index;
}

export function buildAdjacencyMap(liaisons: Liaison[]): AdjacencyMap {
  const map = new Map<string, Set<string>>();

  for (const { source, target } of liaisons) {
    if (!map.has(source)) map.set(source, new Set());
    if (!map.has(target)) map.set(target, new Set());

    map.get(source)!.add(target);
    map.get(target)!.add(source);
  }

  return map;
}

export function getSubgraph(
  centerId: string,
  polesIndex: PolesIndex,
  adjacencyMap: AdjacencyMap,
  maxNodes: number = GRAPH_CONFIG.maxVisibleNodes,
  maxDepth: number = 2
): GraphData {
  const centerPole = polesIndex.get(centerId);
  if (!centerPole) {
    return { nodes: [], links: [] };
  }

  const nodeDepths = new Map<string, number>();
  nodeDepths.set(centerId, 0);

  let currentLevel = new Set<string>([centerId]);

  for (let depth = 1; depth <= maxDepth; depth++) {
    const nextLevel = new Set<string>();
    for (const nodeId of currentLevel) {
      const neighbors = adjacencyMap.get(nodeId) || new Set<string>();
      for (const neighborId of neighbors) {
        if (!nodeDepths.has(neighborId)) {
          nodeDepths.set(neighborId, depth);
          nextLevel.add(neighborId);
        }
      }
    }
    currentLevel = nextLevel;
    if (currentLevel.size === 0) break;
  }

  const sortedNodes = Array.from(nodeDepths.entries())
    .sort((a, b) => a[1] - b[1])
    .slice(0, maxNodes);

  const visibleIds = new Set(sortedNodes.map(([id]) => id));

  const nodes: GraphNode[] = sortedNodes.map(([id, nodeDepth]) => {
    const pole = polesIndex.get(id)!;
    return {
      id: pole.id,
      name: pole.nom,
      type: pole.type,
      depth: nodeDepth
    } as GraphNode;
  });

  const links: { source: string; target: string }[] = [];
  const addedLinks = new Set<string>();

  for (const nodeId of visibleIds) {
    const neighbors = adjacencyMap.get(nodeId) || new Set();
    for (const neighborId of neighbors) {
      if (visibleIds.has(neighborId)) {
        const linkKey = [nodeId, neighborId].sort().join('-');
        if (!addedLinks.has(linkKey)) {
          addedLinks.add(linkKey);
          links.push({ source: nodeId, target: neighborId });
        }
      }
    }
  }

  return { nodes, links };
}

export function searchPoles(
  query: string,
  poles: Pole[],
  maxResults: number = 15
): Pole[] {
  if (!query.trim()) return [];

  const normalizedQuery = query.toLowerCase().trim();

  const results = poles.filter(pole =>
    pole.nom.toLowerCase().includes(normalizedQuery)
  );

  results.sort((a, b) => {
    const aStartsWith = a.nom.toLowerCase().startsWith(normalizedQuery);
    const bStartsWith = b.nom.toLowerCase().startsWith(normalizedQuery);
    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;
    return a.nom.localeCompare(b.nom);
  });

  return results.slice(0, maxResults);
}

export function getConnectionCount(nodeId: string, adjacencyMap: AdjacencyMap): number {
  return adjacencyMap.get(nodeId)?.size || 0;
}
