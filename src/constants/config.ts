export const NODE_CONFIG = {
  unite_recherche: {
    color: '#10B981',
    shape: 'circle' as const,
    size: 4
  },
  odd: {
    color: '#3B82F6',
    shape: 'square' as const,
    size: 5
  },
  center: {
    sizeMultiplier: 1.8,
    strokeColor: '#FCD34D',
    strokeWidth: 1.5
  }
} as const;

export const GRAPH_CONFIG = {
  maxVisibleNodes: 50,
  linkColor: '#94A3B8',
  linkWidth: 1,
  backgroundColor: '#FFFFFF',
  warmupTicks: 50,
  cooldownTime: 3000
} as const;

export const SEARCH_CONFIG = {
  debounceMs: 300,
  maxResults: 15
} as const;
