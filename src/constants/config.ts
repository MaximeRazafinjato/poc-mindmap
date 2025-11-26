export const NODE_CONFIG = {
  theme: {
    color: '#3B82F6',
    shape: 'circle' as const,
    size: 3
  },
  laboratoire: {
    color: '#10B981',
    shape: 'square' as const,
    size: 3
  },
  center: {
    sizeMultiplier: 1.8,
    strokeColor: '#FCD34D',
    strokeWidth: 1.5
  }
} as const;

export const GRAPH_CONFIG = {
  maxVisibleNodes: 50,
  linkColor: '#64748B',
  linkWidth: 1,
  backgroundColor: '#0F172A',
  warmupTicks: 50,
  cooldownTime: 3000
} as const;

export const SEARCH_CONFIG = {
  debounceMs: 300,
  maxResults: 15
} as const;
