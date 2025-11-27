export type NodeType = 'unite_recherche' | 'odd';

export interface Pole {
  id: string;
  nom: string;
  type: NodeType;
}

export interface Liaison {
  source: string;
  target: string;
  weight?: number;
}

export interface GraphNode {
  id: string;
  name: string;
  type: NodeType;
  depth?: number;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  weight?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface ExcelData {
  poles: Pole[];
  liaisons: Liaison[];
}

export type AdjacencyMap = Map<string, Set<string>>;
export type PolesIndex = Map<string, Pole>;
