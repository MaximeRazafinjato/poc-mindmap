import { useCallback, useState } from 'react';
import type { ExcelData } from '@/types';
import { parseExcelFile, parseCSVFiles } from '@/utils/excelParser';

interface FileUploadProps {
  onFileLoaded: (data: ExcelData) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function FileUpload({ onFileLoaded, isLoading, setIsLoading }: FileUploadProps) {
  const [nodesFile, setNodesFile] = useState<File | null>(null);
  const [linksFile, setLinksFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExcelFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError('Format non supporté. Utilisez un fichier .xlsx ou .xls');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const data = await parseExcelFile(file);
      onFileLoaded(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la lecture du fichier');
    } finally {
      setIsLoading(false);
    }
  }, [onFileLoaded, setIsLoading]);

  const handleCSVLoad = useCallback(async (nodes: File, links: File) => {
    setError(null);
    setIsLoading(true);

    try {
      const data = await parseCSVFiles(nodes, links);
      onFileLoaded(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la lecture des fichiers CSV');
    } finally {
      setIsLoading(false);
    }
  }, [onFileLoaded, setIsLoading]);

  const handleNodesFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.match(/\.csv$/i)) {
      setNodesFile(file);
      if (linksFile) {
        handleCSVLoad(file, linksFile);
      }
    }
  }, [linksFile, handleCSVLoad]);

  const handleLinksFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.match(/\.csv$/i)) {
      setLinksFile(file);
      if (nodesFile) {
        handleCSVLoad(nodesFile, file);
      }
    }
  }, [nodesFile, handleCSVLoad]);

  const handleExcelInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleExcelFile(file);
  }, [handleExcelFile]);

  return (
    <div className="flex flex-col items-center justify-center p-8 gap-8">
      <div className="w-full max-w-2xl">
        <h2 className="text-xl font-semibold text-slate-700 mb-4 text-center">Import CSV (2 fichiers)</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-6 border-2 border-dashed rounded-xl ${nodesFile ? 'border-green-500 bg-green-50' : 'border-slate-300 bg-white'}`}>
            <div className="flex flex-col items-center text-center">
              <svg className={`w-8 h-8 mb-3 ${nodesFile ? 'text-green-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-slate-600 text-sm mb-2">Fichier Noeuds</p>
              {nodesFile ? (
                <p className="text-green-600 text-xs">{nodesFile.name}</p>
              ) : (
                <label className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg cursor-pointer">
                  Choisir
                  <input type="file" accept=".csv" onChange={handleNodesFileChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div className={`p-6 border-2 border-dashed rounded-xl ${linksFile ? 'border-green-500 bg-green-50' : 'border-slate-300 bg-white'}`}>
            <div className="flex flex-col items-center text-center">
              <svg className={`w-8 h-8 mb-3 ${linksFile ? 'text-green-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <p className="text-slate-600 text-sm mb-2">Fichier Liens</p>
              {linksFile ? (
                <p className="text-green-600 text-xs">{linksFile.name}</p>
              ) : (
                <label className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg cursor-pointer">
                  Choisir
                  <input type="file" accept=".csv" onChange={handleLinksFileChange} className="hidden" />
                </label>
              )}
            </div>
          </div>
        </div>
        <p className="text-slate-500 text-xs mt-2 text-center">
          Noeuds: id;actors;type | Liens: from;to;weight
        </p>
      </div>

      <div className="text-slate-400 text-sm">ou</div>

      <div className="w-full max-w-md">
        <h2 className="text-xl font-semibold text-slate-700 mb-4 text-center">Import Excel</h2>
        <div className="p-6 border-2 border-dashed rounded-xl border-slate-300 hover:border-slate-400 bg-white">
          <div className="flex flex-col items-center text-center">
            <svg className="w-10 h-10 mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {isLoading ? (
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mb-2" />
                <p className="text-slate-600 text-sm">Lecture...</p>
              </div>
            ) : (
              <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer">
                Choisir un fichier Excel
                <input type="file" accept=".xlsx,.xls" onChange={handleExcelInputChange} className="hidden" />
              </label>
            )}
          </div>
        </div>
        <p className="text-slate-500 text-xs mt-2 text-center">
          Onglet 1: Noeuds | Onglet 2: Liaisons
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
