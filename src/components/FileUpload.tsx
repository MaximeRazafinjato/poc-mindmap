import { useCallback, useState } from 'react';
import type { ExcelData } from '@/types';
import { parseExcelFile } from '@/utils/excelParser';

interface FileUploadProps {
  onFileLoaded: (data: ExcelData) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function FileUpload({ onFileLoaded, isLoading, setIsLoading }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          w-full max-w-md p-8 border-2 border-dashed rounded-xl
          transition-all duration-200 cursor-pointer
          ${isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
          }
        `}
      >
        <div className="flex flex-col items-center text-center">
          <svg
            className={`w-12 h-12 mb-4 ${isDragging ? 'text-blue-400' : 'text-slate-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          {isLoading ? (
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-slate-300">Lecture du fichier...</p>
            </div>
          ) : (
            <>
              <p className="text-slate-300 mb-2">
                Déposez votre fichier Excel ici
              </p>
              <p className="text-slate-500 text-sm mb-4">
                ou cliquez pour parcourir
              </p>
              <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors">
                Choisir un fichier
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleInputChange}
                  className="hidden"
                />
              </label>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="mt-6 text-slate-500 text-sm text-center">
        <p className="mb-1">Format attendu :</p>
        <p>Onglet 1 "Poles" : ID | Nom | Type</p>
        <p>Onglet 2 "Liaisons" : ID_Source | ID_Cible</p>
      </div>
    </div>
  );
}
