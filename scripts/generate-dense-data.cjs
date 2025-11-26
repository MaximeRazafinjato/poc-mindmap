const XLSX = require('xlsx');
const path = require('path');

const TOTAL_POLES = 150;
const TOTAL_LIAISONS = 50000;

function generateNodeId(type, index) {
  return `${type}_${String(index).padStart(3, '0')}`;
}

function generateData() {
  const poles = [];
  const liaisons = [];
  const nodeLiaisonCount = new Map();
  const existingLiaisons = new Set();

  const themes = [];
  const labs = [];

  console.log(`Création de ${TOTAL_POLES} pôles...`);

  const numThemes = Math.floor(TOTAL_POLES / 2);
  const numLabs = TOTAL_POLES - numThemes;

  for (let i = 0; i < numThemes; i++) {
    const nodeId = generateNodeId('THEME', i);
    const node = { id: nodeId, nom: `Thème ${i + 1}`, type: 'theme' };
    poles.push(node);
    themes.push(node);
    nodeLiaisonCount.set(nodeId, 0);
  }

  for (let i = 0; i < numLabs; i++) {
    const nodeId = generateNodeId('LAB', i);
    const node = { id: nodeId, nom: `Laboratoire ${i + 1}`, type: 'laboratoire' };
    poles.push(node);
    labs.push(node);
    nodeLiaisonCount.set(nodeId, 0);
  }

  function getLiaisonKey(source, target) {
    return source < target ? `${source}|${target}` : `${target}|${source}`;
  }

  function addLiaison(source, target) {
    if (source.id === target.id) return false;
    const key = getLiaisonKey(source.id, target.id);
    if (existingLiaisons.has(key)) return false;

    existingLiaisons.add(key);
    liaisons.push({ source: source.id, target: target.id });
    nodeLiaisonCount.set(source.id, nodeLiaisonCount.get(source.id) + 1);
    nodeLiaisonCount.set(target.id, nodeLiaisonCount.get(target.id) + 1);
    return true;
  }

  const maxPossibleLiaisons = (TOTAL_POLES * (TOTAL_POLES - 1)) / 2;
  console.log(`Maximum théorique de liaisons: ${maxPossibleLiaisons}`);

  console.log('\nPhase 1: Super-hubs (5 pôles connectés à TOUS les autres)...');
  const superHubs = poles.slice(0, 5);
  for (const hub of superHubs) {
    for (const pole of poles) {
      addLiaison(hub, pole);
    }
  }
  console.log(`Liaisons après super-hubs: ${liaisons.length}`);

  console.log('\nPhase 2: Hubs moyens (20 pôles très connectés)...');
  const mediumHubs = poles.slice(5, 25);
  for (const hub of mediumHubs) {
    const targets = poles.filter(p => p.id !== hub.id).sort(() => Math.random() - 0.5).slice(0, 100);
    for (const target of targets) {
      addLiaison(hub, target);
    }
  }
  console.log(`Liaisons après hubs moyens: ${liaisons.length}`);

  console.log('\nPhase 3: Connexions normales (reste des pôles)...');
  const normalPoles = poles.slice(25);
  for (const pole of normalPoles) {
    const numConnections = Math.floor(Math.random() * 40) + 20;
    const targets = poles.filter(p => p.id !== pole.id).sort(() => Math.random() - 0.5).slice(0, numConnections);
    for (const target of targets) {
      addLiaison(pole, target);
    }
  }
  console.log(`Liaisons après connexions normales: ${liaisons.length}`);

  console.log('\nPhase 4: Remplissage aléatoire...');
  let attempts = 0;
  const maxAttempts = maxPossibleLiaisons * 2;

  while (liaisons.length < Math.min(TOTAL_LIAISONS, maxPossibleLiaisons) && attempts < maxAttempts) {
    const p1 = poles[Math.floor(Math.random() * poles.length)];
    const p2 = poles[Math.floor(Math.random() * poles.length)];
    addLiaison(p1, p2);
    attempts++;
  }

  console.log(`\nLiaisons finales: ${liaisons.length}/${maxPossibleLiaisons} (max possible)`);

  return { poles, liaisons, nodeLiaisonCount };
}

function createExcelFile(poles, liaisons) {
  const workbook = XLSX.utils.book_new();

  const polesData = poles.map(p => ({
    'ID': p.id,
    'Nom': p.nom,
    'Type': p.type
  }));
  const polesSheet = XLSX.utils.json_to_sheet(polesData);
  XLSX.utils.book_append_sheet(workbook, polesSheet, 'Poles');

  const liaisonsData = liaisons.map(l => ({
    'ID_Source': l.source,
    'ID_Cible': l.target
  }));
  const liaisonsSheet = XLSX.utils.json_to_sheet(liaisonsData);
  XLSX.utils.book_append_sheet(workbook, liaisonsSheet, 'Liaisons');

  const outputPath = path.join(__dirname, '..', 'test-data', 'test-150-poles-dense.xlsx');
  XLSX.writeFile(workbook, outputPath);

  return outputPath;
}

function printStats(poles, liaisons, nodeLiaisonCount) {
  const counts = Array.from(nodeLiaisonCount.values());
  const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
  const max = Math.max(...counts);
  const min = Math.min(...counts);

  const sorted = [...counts].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  const themeCount = poles.filter(p => p.type === 'theme').length;
  const labCount = poles.filter(p => p.type === 'laboratoire').length;

  console.log('\n=== Statistiques ===');
  console.log(`Nombre de pôles: ${poles.length} (${themeCount} thèmes, ${labCount} labs)`);
  console.log(`Nombre de liaisons: ${liaisons.length}`);
  console.log(`Liaisons par nœud - Min: ${min}, Max: ${max}, Moyenne: ${avg.toFixed(1)}, Médiane: ${median}`);

  const distribution = {};
  counts.forEach(c => {
    const bucket = Math.floor(c / 20) * 20;
    const key = `${bucket}-${bucket + 19}`;
    distribution[key] = (distribution[key] || 0) + 1;
  });

  console.log('\nDistribution des liaisons par nœud:');
  Object.entries(distribution)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .forEach(([range, count]) => {
      console.log(`  ${range.padEnd(10)}: ${count} nœuds`);
    });

  console.log('\nTop 5 nœuds les plus connectés:');
  const topNodes = poles
    .map(p => ({ nom: p.nom, type: p.type, count: nodeLiaisonCount.get(p.id) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  topNodes.forEach((n, i) => {
    console.log(`  ${i + 1}. ${n.nom} (${n.type}): ${n.count} liaisons`);
  });

  console.log('\n5 nœuds les moins connectés:');
  const bottomNodes = poles
    .map(p => ({ nom: p.nom, type: p.type, count: nodeLiaisonCount.get(p.id) }))
    .sort((a, b) => a.count - b.count)
    .slice(0, 5);

  bottomNodes.forEach((n, i) => {
    console.log(`  ${n.nom} (${n.type}): ${n.count} liaisons`);
  });
}

console.log('='.repeat(60));
console.log('Génération dense avec liaisons inter-types');
console.log('(thème↔thème, lab↔lab, thème↔lab autorisés)');
console.log('='.repeat(60));

const { poles, liaisons, nodeLiaisonCount } = generateData();
printStats(poles, liaisons, nodeLiaisonCount);

console.log('\nCréation du fichier Excel...');
const outputPath = createExcelFile(poles, liaisons);
console.log(`Fichier créé: ${outputPath}`);
