import * as XLSX from 'xlsx';
import type { Pole, Liaison, ExcelData, NodeType } from '@/types';

interface RawPoleRow {
  ID: string;
  Nom: string;
  Type: string;
}

interface RawLiaisonRow {
  ID_Source: string;
  ID_Cible: string;
}

function normalizeType(type: string): NodeType {
  const normalized = type.toLowerCase().trim();
  if (normalized === 'theme' || normalized === 'thème') return 'theme';
  if (normalized === 'laboratoire' || normalized === 'labo') return 'laboratoire';
  return 'theme';
}

export async function parseExcelFile(file: File): Promise<ExcelData> {
  const arrayBuffer = await file.arrayBuffer();

  const workbook = XLSX.read(arrayBuffer, {
    dense: true,
    cellFormula: false,
    cellHTML: false,
    cellStyles: false
  });

  const sheetNames = workbook.SheetNames;

  if (sheetNames.length < 2) {
    throw new Error('Le fichier Excel doit contenir au moins 2 onglets (Poles et Liaisons)');
  }

  const polesSheet = workbook.Sheets[sheetNames[0]];
  const liaisonsSheet = workbook.Sheets[sheetNames[1]];

  const rawPoles = XLSX.utils.sheet_to_json<RawPoleRow>(polesSheet);
  const rawLiaisons = XLSX.utils.sheet_to_json<RawLiaisonRow>(liaisonsSheet);

  const poles: Pole[] = rawPoles.map(row => ({
    id: String(row.ID).trim(),
    nom: String(row.Nom).trim(),
    type: normalizeType(row.Type)
  }));

  const liaisons: Liaison[] = rawLiaisons.map(row => ({
    source: String(row.ID_Source).trim(),
    target: String(row.ID_Cible).trim()
  }));

  return { poles, liaisons };
}
