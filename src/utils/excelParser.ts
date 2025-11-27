import * as XLSX from 'xlsx';
import type { Pole, Liaison, ExcelData, NodeType } from '@/types';

interface RawNodeRow {
  id?: string;
  ID?: string;
  actors?: string;
  Nom?: string;
  type?: string;
  Type?: string;
  'degree.size'?: number;
}

interface RawLinkRow {
  from?: string;
  ID_Source?: string;
  to?: string;
  ID_Cible?: string;
  weight?: number;
}

function normalizeType(type: string): NodeType {
  const normalized = type.toLowerCase().trim();
  if (normalized === 'odd') return 'odd';
  if (normalized === 'unité de recherche' || normalized === 'unite de recherche') return 'unite_recherche';
  return 'unite_recherche';
}

function parseCSVContent(content: string, separator = ';'): Record<string, string>[] {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(separator).map(h => h.trim());

  return lines.slice(1).map(line => {
    const values = line.split(separator);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() ?? '';
    });
    return row;
  });
}

async function readFileWithEncoding(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);

  const hasUtf8Bom = uint8Array[0] === 0xEF && uint8Array[1] === 0xBB && uint8Array[2] === 0xBF;
  if (hasUtf8Bom) {
    return new TextDecoder('utf-8').decode(buffer);
  }

  const utf8Text = new TextDecoder('utf-8').decode(buffer);
  if (!utf8Text.includes('�')) {
    return utf8Text;
  }

  return new TextDecoder('windows-1252').decode(buffer);
}

export async function parseCSVFiles(nodesFile: File, linksFile: File): Promise<ExcelData> {
  const nodesContent = await readFileWithEncoding(nodesFile);
  const linksContent = await readFileWithEncoding(linksFile);

  const rawNodes = parseCSVContent(nodesContent) as unknown as RawNodeRow[];
  const rawLinks = parseCSVContent(linksContent) as unknown as RawLinkRow[];

  const poles: Pole[] = rawNodes.map(row => ({
    id: String(row.id || '').trim(),
    nom: String(row.actors || '').trim(),
    type: normalizeType(row.type || '')
  }));

  const liaisons: Liaison[] = rawLinks.map(row => ({
    source: String(row.from || '').trim(),
    target: String(row.to || '').trim(),
    weight: row.weight ? Number(row.weight) : undefined
  }));

  return { poles, liaisons };
}

export async function parseExcelFile(file: File): Promise<ExcelData> {
  const arrayBuffer = await file.arrayBuffer();

  const workbook = XLSX.read(arrayBuffer, {
    dense: true,
    cellFormula: false,
    cellHTML: false,
    cellStyles: false,
    codepage: 65001
  });

  const sheetNames = workbook.SheetNames;

  if (sheetNames.length < 2) {
    throw new Error('Le fichier Excel doit contenir au moins 2 onglets (Poles et Liaisons)');
  }

  const polesSheet = workbook.Sheets[sheetNames[0]];
  const liaisonsSheet = workbook.Sheets[sheetNames[1]];

  const rawPoles = XLSX.utils.sheet_to_json<RawNodeRow>(polesSheet);
  const rawLiaisons = XLSX.utils.sheet_to_json<RawLinkRow>(liaisonsSheet);

  const poles: Pole[] = rawPoles.map(row => ({
    id: String(row.id || row.ID || '').trim(),
    nom: String(row.actors || row.Nom || '').trim(),
    type: normalizeType(row.type || row.Type || '')
  }));

  const liaisons: Liaison[] = rawLiaisons.map(row => ({
    source: String(row.from || row.ID_Source || '').trim(),
    target: String(row.to || row.ID_Cible || '').trim(),
    weight: row.weight ? Number(row.weight) : undefined
  }));

  return { poles, liaisons };
}
