import type { Pole, AdjacencyMap, PolesIndex } from '@/types';
import { getConnectionCount } from '@/utils/graphHelpers';

interface NavigationControlsProps {
  currentNode: Pole | null;
  navigationHistory: string[];
  polesIndex: PolesIndex;
  adjacencyMap: AdjacencyMap;
  onGoBack: () => void;
}

export function NavigationControls({
  currentNode,
  navigationHistory,
  polesIndex,
  adjacencyMap,
  onGoBack
}: NavigationControlsProps) {
  const canGoBack = navigationHistory.length > 0;
  const connectionCount = currentNode
    ? getConnectionCount(currentNode.id, adjacencyMap)
    : 0;

  return (
    <div className="flex items-center gap-4 p-4 bg-white/80 backdrop-blur border-b border-slate-200">
      <button
        onClick={onGoBack}
        disabled={!canGoBack}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg
          ${canGoBack
            ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }
        `}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      {currentNode && (
        <div className="flex items-center gap-3">
          <div className="h-6 w-px bg-slate-300" />

          <div className="flex items-center gap-2">
            <span
              className={`
                w-3 h-3
                ${currentNode.type === 'unite_recherche' ? 'rounded-full' : 'rounded-sm'}
              `}
              style={{
                backgroundColor: currentNode.type === 'unite_recherche' ? '#10B981' : '#3B82F6'
              }}
            />
            <span className="text-slate-700 font-medium">{currentNode.nom}</span>
            <span className="text-slate-500 text-sm">({currentNode.type})</span>
          </div>

          <span className="text-slate-500 text-sm">
            {connectionCount} connexion{connectionCount > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {navigationHistory.length > 0 && (
        <div className="ml-auto flex items-center gap-2 text-sm text-slate-500">
          <span>Historique:</span>
          {navigationHistory.slice(-3).map((id, i) => {
            const pole = polesIndex.get(id);
            return (
              <span key={id} className="flex items-center gap-1">
                {i > 0 && <span className="text-slate-400">→</span>}
                <span className="truncate max-w-[100px]">{pole?.nom || id}</span>
              </span>
            );
          })}
          <span className="text-slate-400">→</span>
          <span className="text-blue-600">{currentNode?.nom}</span>
        </div>
      )}
    </div>
  );
}
