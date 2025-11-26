import * as XLSX from 'xlsx';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const themes = [
  { id: 'T001', nom: 'Intelligence Artificielle', type: 'theme' },
  { id: 'T002', nom: 'Machine Learning', type: 'theme' },
  { id: 'T003', nom: 'Deep Learning', type: 'theme' },
  { id: 'T004', nom: 'Traitement du Langage Naturel', type: 'theme' },
  { id: 'T005', nom: 'Vision par Ordinateur', type: 'theme' },
  { id: 'T006', nom: 'Robotique', type: 'theme' },
  { id: 'T007', nom: 'Internet des Objets', type: 'theme' },
  { id: 'T008', nom: 'Big Data', type: 'theme' },
  { id: 'T009', nom: 'Cloud Computing', type: 'theme' },
  { id: 'T010', nom: 'Cybersécurité', type: 'theme' },
  { id: 'T011', nom: 'Blockchain', type: 'theme' },
  { id: 'T012', nom: 'Réalité Virtuelle', type: 'theme' },
  { id: 'T013', nom: 'Réalité Augmentée', type: 'theme' },
  { id: 'T014', nom: 'Informatique Quantique', type: 'theme' },
  { id: 'T015', nom: 'Edge Computing', type: 'theme' },
];

const laboratoires = [
  { id: 'L001', nom: 'Laboratoire IA Avancée', type: 'laboratoire' },
  { id: 'L002', nom: 'Centre de Recherche ML', type: 'laboratoire' },
  { id: 'L003', nom: 'Institut Robotique', type: 'laboratoire' },
  { id: 'L004', nom: 'Laboratoire NLP', type: 'laboratoire' },
  { id: 'L005', nom: 'Centre Vision Numérique', type: 'laboratoire' },
  { id: 'L006', nom: 'Institut IoT', type: 'laboratoire' },
  { id: 'L007', nom: 'Laboratoire Big Data', type: 'laboratoire' },
  { id: 'L008', nom: 'Centre Cloud Innovation', type: 'laboratoire' },
  { id: 'L009', nom: 'Institut Cybersécurité', type: 'laboratoire' },
  { id: 'L010', nom: 'Laboratoire Blockchain', type: 'laboratoire' },
  { id: 'L011', nom: 'Centre XR Innovation', type: 'laboratoire' },
  { id: 'L012', nom: 'Institut Quantique', type: 'laboratoire' },
  { id: 'L013', nom: 'Laboratoire Systèmes Distribués', type: 'laboratoire' },
  { id: 'L014', nom: 'Centre Optimisation', type: 'laboratoire' },
  { id: 'L015', nom: 'Institut Calcul Haute Performance', type: 'laboratoire' },
];

const poles = [...themes, ...laboratoires];

const liaisons = [
  { ID_Source: 'T001', ID_Cible: 'L001' },
  { ID_Source: 'T001', ID_Cible: 'L002' },
  { ID_Source: 'T001', ID_Cible: 'T002' },
  { ID_Source: 'T001', ID_Cible: 'T003' },
  { ID_Source: 'T001', ID_Cible: 'T004' },
  { ID_Source: 'T001', ID_Cible: 'T005' },
  { ID_Source: 'T002', ID_Cible: 'L002' },
  { ID_Source: 'T002', ID_Cible: 'T003' },
  { ID_Source: 'T002', ID_Cible: 'T008' },
  { ID_Source: 'T002', ID_Cible: 'L007' },
  { ID_Source: 'T003', ID_Cible: 'L001' },
  { ID_Source: 'T003', ID_Cible: 'L002' },
  { ID_Source: 'T003', ID_Cible: 'T004' },
  { ID_Source: 'T003', ID_Cible: 'T005' },
  { ID_Source: 'T004', ID_Cible: 'L004' },
  { ID_Source: 'T004', ID_Cible: 'L001' },
  { ID_Source: 'T005', ID_Cible: 'L005' },
  { ID_Source: 'T005', ID_Cible: 'L003' },
  { ID_Source: 'T005', ID_Cible: 'T006' },
  { ID_Source: 'T006', ID_Cible: 'L003' },
  { ID_Source: 'T006', ID_Cible: 'L001' },
  { ID_Source: 'T006', ID_Cible: 'T007' },
  { ID_Source: 'T007', ID_Cible: 'L006' },
  { ID_Source: 'T007', ID_Cible: 'T008' },
  { ID_Source: 'T007', ID_Cible: 'T015' },
  { ID_Source: 'T008', ID_Cible: 'L007' },
  { ID_Source: 'T008', ID_Cible: 'L008' },
  { ID_Source: 'T008', ID_Cible: 'T009' },
  { ID_Source: 'T009', ID_Cible: 'L008' },
  { ID_Source: 'T009', ID_Cible: 'L013' },
  { ID_Source: 'T009', ID_Cible: 'T015' },
  { ID_Source: 'T010', ID_Cible: 'L009' },
  { ID_Source: 'T010', ID_Cible: 'T011' },
  { ID_Source: 'T010', ID_Cible: 'T009' },
  { ID_Source: 'T011', ID_Cible: 'L010' },
  { ID_Source: 'T011', ID_Cible: 'L013' },
  { ID_Source: 'T012', ID_Cible: 'L011' },
  { ID_Source: 'T012', ID_Cible: 'T013' },
  { ID_Source: 'T012', ID_Cible: 'T005' },
  { ID_Source: 'T013', ID_Cible: 'L011' },
  { ID_Source: 'T013', ID_Cible: 'L005' },
  { ID_Source: 'T014', ID_Cible: 'L012' },
  { ID_Source: 'T014', ID_Cible: 'L015' },
  { ID_Source: 'T014', ID_Cible: 'T010' },
  { ID_Source: 'T015', ID_Cible: 'L006' },
  { ID_Source: 'T015', ID_Cible: 'L013' },
  { ID_Source: 'L001', ID_Cible: 'L002' },
  { ID_Source: 'L001', ID_Cible: 'L004' },
  { ID_Source: 'L002', ID_Cible: 'L007' },
  { ID_Source: 'L003', ID_Cible: 'L005' },
  { ID_Source: 'L003', ID_Cible: 'L006' },
  { ID_Source: 'L006', ID_Cible: 'L008' },
  { ID_Source: 'L007', ID_Cible: 'L008' },
  { ID_Source: 'L008', ID_Cible: 'L013' },
  { ID_Source: 'L009', ID_Cible: 'L010' },
  { ID_Source: 'L011', ID_Cible: 'L005' },
  { ID_Source: 'L012', ID_Cible: 'L015' },
  { ID_Source: 'L013', ID_Cible: 'L015' },
  { ID_Source: 'L014', ID_Cible: 'L002' },
  { ID_Source: 'L014', ID_Cible: 'L015' },
];

const polesData = poles.map(p => ({
  ID: p.id,
  Nom: p.nom,
  Type: p.type
}));

const workbook = XLSX.utils.book_new();

const polesSheet = XLSX.utils.json_to_sheet(polesData);
XLSX.utils.book_append_sheet(workbook, polesSheet, 'Poles');

const liaisonsSheet = XLSX.utils.json_to_sheet(liaisons);
XLSX.utils.book_append_sheet(workbook, liaisonsSheet, 'Liaisons');

const outputDir = join(__dirname, '..', 'test-data');
try {
  mkdirSync(outputDir, { recursive: true });
} catch (e) {}

const outputPath = join(outputDir, 'test-poles-liaisons.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log(`Fichier Excel de test créé: ${outputPath}`);
console.log(`- ${poles.length} pôles (${themes.length} thèmes, ${laboratoires.length} laboratoires)`);
console.log(`- ${liaisons.length} liaisons`);
