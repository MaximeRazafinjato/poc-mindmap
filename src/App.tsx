import { useState, useMemo, useCallback } from 'react';
import type { ExcelData, Pole, GraphNode, AdjacencyMap, PolesIndex } from '@/types';
import { buildPolesIndex, buildAdjacencyMap, getSubgraph } from '@/utils/graphHelpers';
import { FileUpload } from '@/components/FileUpload';
import { SearchBar } from '@/components/SearchBar';
import { GraphViewer } from '@/components/GraphViewer';
import { NavigationControls } from '@/components/NavigationControls';

const DEFAULT_DEPTH = 2;
const MAX_DEPTH = 5;
const MAX_NODES = 2000;

function App() {
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [centerNodeId, setCenterNodeId] = useState<string | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [depth, setDepth] = useState(DEFAULT_DEPTH);

  const polesIndex = useMemo<PolesIndex>(() => {
    if (!excelData) return new Map();
    return buildPolesIndex(excelData.poles);
  }, [excelData]);

  const adjacencyMap = useMemo<AdjacencyMap>(() => {
    if (!excelData) return new Map();
    return buildAdjacencyMap(excelData.liaisons);
  }, [excelData]);

  const graphData = useMemo(() => {
    if (!centerNodeId || !excelData) {
      return { nodes: [], links: [] };
    }
    return getSubgraph(centerNodeId, polesIndex, adjacencyMap, MAX_NODES, depth);
  }, [centerNodeId, polesIndex, adjacencyMap, excelData, depth]);

  const currentNode = useMemo(() => {
    if (!centerNodeId) return null;
    return polesIndex.get(centerNodeId) || null;
  }, [centerNodeId, polesIndex]);

  const handleFileLoaded = useCallback((data: ExcelData) => {
    setExcelData(data);
    setNavigationHistory([]);
    setDepth(DEFAULT_DEPTH);
    if (data.poles.length > 0) {
      setCenterNodeId(data.poles[0].id);
    } else {
      setCenterNodeId(null);
    }
  }, []);

  const handleSelectPole = useCallback((pole: Pole) => {
    if (centerNodeId) {
      setNavigationHistory(prev => [...prev, centerNodeId]);
    }
    setCenterNodeId(pole.id);
  }, [centerNodeId]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    if (node.id === centerNodeId) return;
    setNavigationHistory(prev => [...prev, centerNodeId!]);
    setCenterNodeId(node.id);
  }, [centerNodeId]);

  const handleGoBack = useCallback(() => {
    if (navigationHistory.length === 0) return;
    const previousId = navigationHistory[navigationHistory.length - 1];
    setNavigationHistory(prev => prev.slice(0, -1));
    setCenterNodeId(previousId);
  }, [navigationHistory]);

  const handleReset = useCallback(() => {
    setExcelData(null);
    setCenterNodeId(null);
    setNavigationHistory([]);
  }, []);

  if (!excelData) {
    return (
      <div className="h-full bg-slate-900 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-slate-200 mb-8">
          Visualisation Mindmap
        </h1>
        <FileUpload
          onFileLoaded={handleFileLoaded}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-900 flex flex-col">
      <header className="flex items-center gap-4 p-4 bg-slate-800 border-b border-slate-700">
        <h1 className="text-lg font-semibold text-slate-200">Mindmap</h1>

        <div className="flex-1 flex justify-center">
          <SearchBar
            poles={excelData.poles}
            onSelectPole={handleSelectPole}
          />
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span>{excelData.poles.length} pôles</span>
          <span>•</span>
          <span>{excelData.liaisons.length} liaisons</span>
          <span>•</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Profondeur</span>
            <button
              onClick={() => setDepth(d => Math.max(1, d - 1))}
              disabled={depth <= 1}
              className="w-6 h-6 flex items-center justify-center bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 rounded transition-colors"
            >
              -
            </button>
            <span className="w-4 text-center text-slate-300">{depth}</span>
            <button
              onClick={() => setDepth(d => Math.min(MAX_DEPTH, d + 1))}
              disabled={depth >= MAX_DEPTH}
              className="w-6 h-6 flex items-center justify-center bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 rounded transition-colors"
            >
              +
            </button>
          </div>
          <button
            onClick={handleReset}
            className="ml-2 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
          >
            Nouveau fichier
          </button>
        </div>
      </header>

      {centerNodeId && (
        <NavigationControls
          currentNode={currentNode}
          navigationHistory={navigationHistory}
          polesIndex={polesIndex}
          adjacencyMap={adjacencyMap}
          onGoBack={handleGoBack}
        />
      )}

      <main className="flex-1 relative">
        {!centerNodeId ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p className="text-slate-400 text-lg mb-2">
                Utilisez la barre de recherche
              </p>
              <p className="text-slate-600">
                pour sélectionner un thème ou un laboratoire
              </p>
            </div>
          </div>
        ) : (
          <GraphViewer
            graphData={graphData}
            centerNodeId={centerNodeId}
            onNodeClick={handleNodeClick}
          />
        )}
      </main>

      <footer className="p-2 bg-slate-800 border-t border-slate-700 text-center text-xs text-slate-600">
        <span className="inline-flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Thème
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-emerald-500" /> Laboratoire
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full border-2 border-yellow-400" /> Nœud central
          </span>
          {graphData.nodes.length > 0 && (
            <span className="text-slate-500">
              | {graphData.nodes.length} nœuds affichés {graphData.nodes.length >= MAX_NODES && '(limite atteinte)'}
            </span>
          )}
        </span>
      </footer>
    </div>
  );
}

export default App;
