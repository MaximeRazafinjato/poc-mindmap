const XLSX = require('xlsx');
const path = require('path');

const TOTAL_LIAISONS = 50000;
const MAX_LIAISONS_PER_NODE = 50;
const TARGET_AVG_LIAISONS = 10;

function generateNodeId(type, index) {
  return `${type}_${String(index).padStart(5, '0')}`;
}

function generateData() {
  const poles = [];
  const liaisons = [];
  const nodeLiaisonCount = new Map();
  const existingLiaisons = new Set();

  let themeCount = 0;
  let labCount = 0;

  const themes = [];
  const labs = [];

  function createTheme() {
    const nodeId = generateNodeId('THEME', themeCount++);
    const node = { id: nodeId, nom: `Thème ${themeCount}`, type: 'theme' };
    poles.push(node);
    themes.push(node);
    nodeLiaisonCount.set(nodeId, 0);
    return node;
  }

  function createLab() {
    const nodeId = generateNodeId('LAB', labCount++);
    const node = { id: nodeId, nom: `Laboratoire ${labCount}`, type: 'laboratoire' };
    poles.push(node);
    labs.push(node);
    nodeLiaisonCount.set(nodeId, 0);
    return node;
  }

  function getLiaisonKey(source, target) {
    return source < target ? `${source}|${target}` : `${target}|${source}`;
  }

  function addLiaison(source, target) {
    const key = getLiaisonKey(source.id, target.id);
    if (existingLiaisons.has(key)) return false;
    if (nodeLiaisonCount.get(source.id) >= MAX_LIAISONS_PER_NODE) return false;
    if (nodeLiaisonCount.get(target.id) >= MAX_LIAISONS_PER_NODE) return false;

    existingLiaisons.add(key);
    liaisons.push({ source: source.id, target: target.id });
    nodeLiaisonCount.set(source.id, nodeLiaisonCount.get(source.id) + 1);
    nodeLiaisonCount.set(target.id, nodeLiaisonCount.get(target.id) + 1);
    return true;
  }

  console.log('Création des chaînes profondes...');

  const numChains = 500;
  const chainLength = 20;

  for (let c = 0; c < numChains; c++) {
    const chain = [];

    for (let i = 0; i < chainLength; i++) {
      const node = i % 2 === 0 ? createTheme() : createLab();
      chain.push(node);

      if (i > 0) {
        addLiaison(chain[i - 1], node);
      }
    }

    const branchPoints = [3, 7, 11, 15];
    for (const bp of branchPoints) {
      if (bp < chain.length) {
        const branchNode = chain[bp];
        const numBranches = Math.floor(Math.random() * 3) + 2;

        for (let b = 0; b < numBranches; b++) {
          const isTheme = branchNode.type === 'laboratoire';
          const newNode = isTheme ? createTheme() : createLab();
          addLiaison(branchNode, newNode);

          if (Math.random() < 0.7) {
            const secondNode = isTheme ? createLab() : createTheme();
            addLiaison(newNode, secondNode);

            if (Math.random() < 0.5) {
              const thirdNode = isTheme ? createTheme() : createLab();
              addLiaison(secondNode, thirdNode);
            }
          }
        }
      }
    }
  }

  console.log(`Liaisons après chaînes: ${liaisons.length}`);
  console.log(`Nœuds créés: ${poles.length}`);

  console.log('Création des clusters interconnectés...');

  const numClusters = 100;
  const clusterSize = 15;

  for (let cl = 0; cl < numClusters; cl++) {
    const clusterThemes = [];
    const clusterLabs = [];

    for (let i = 0; i < clusterSize; i++) {
      if (i % 2 === 0) {
        clusterThemes.push(createTheme());
      } else {
        clusterLabs.push(createLab());
      }
    }

    for (const theme of clusterThemes) {
      const numConnections = Math.floor(Math.random() * 4) + 2;
      const shuffledLabs = [...clusterLabs].sort(() => Math.random() - 0.5);

      for (let i = 0; i < Math.min(numConnections, shuffledLabs.length); i++) {
        addLiaison(theme, shuffledLabs[i]);
      }
    }

    if (cl > 0 && Math.random() < 0.8) {
      const prevClusterStart = (cl - 1) * clusterSize * 2;
      const bridgeSource = poles[prevClusterStart + Math.floor(Math.random() * clusterSize)];
      const bridgeTarget = clusterThemes.length > 0 ? clusterThemes[0] : clusterLabs[0];

      if (bridgeSource && bridgeTarget && bridgeSource.type !== bridgeTarget.type) {
        addLiaison(bridgeSource, bridgeTarget);
      }
    }
  }

  console.log(`Liaisons après clusters: ${liaisons.length}`);

  console.log('Ajout de connexions croisées pour la profondeur...');

  const allThemes = poles.filter(p => p.type === 'theme');
  const allLabs = poles.filter(p => p.type === 'laboratoire');

  while (liaisons.length < TOTAL_LIAISONS) {
    const theme = allThemes[Math.floor(Math.random() * allThemes.length)];
    const lab = allLabs[Math.floor(Math.random() * allLabs.length)];

    if (nodeLiaisonCount.get(theme.id) < MAX_LIAISONS_PER_NODE &&
        nodeLiaisonCount.get(lab.id) < MAX_LIAISONS_PER_NODE) {
      addLiaison(theme, lab);
    }

    if (liaisons.length % 10000 === 0) {
      console.log(`Progress: ${liaisons.length}/${TOTAL_LIAISONS} liaisons`);
    }
  }

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

  const outputPath = path.join(__dirname, '..', 'test-data', 'test-50k-deep.xlsx');
  XLSX.writeFile(workbook, outputPath);

  return outputPath;
}

function analyzeDepth(poles, liaisons) {
  const adjacency = new Map();

  for (const pole of poles) {
    adjacency.set(pole.id, new Set());
  }

  for (const liaison of liaisons) {
    adjacency.get(liaison.source)?.add(liaison.target);
    adjacency.get(liaison.target)?.add(liaison.source);
  }

  function bfs(startId, maxDepth) {
    const visited = new Set([startId]);
    const queue = [{ id: startId, depth: 0 }];
    const depthCounts = { 1: 0, 2: 0, 3: 0 };

    while (queue.length > 0) {
      const { id, depth } = queue.shift();

      if (depth >= maxDepth) continue;

      for (const neighborId of adjacency.get(id) || []) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          const newDepth = depth + 1;
          if (depthCounts[newDepth] !== undefined) {
            depthCounts[newDepth]++;
          }
          queue.push({ id: neighborId, depth: newDepth });
        }
      }
    }

    return depthCounts;
  }

  const sampleSize = Math.min(100, poles.length);
  const sampleIndices = new Set();
  while (sampleIndices.size < sampleSize) {
    sampleIndices.add(Math.floor(Math.random() * poles.length));
  }

  let totalDepth1 = 0;
  let totalDepth2 = 0;
  let totalDepth3 = 0;

  for (const idx of sampleIndices) {
    const counts = bfs(poles[idx].id, 3);
    totalDepth1 += counts[1];
    totalDepth2 += counts[2];
    totalDepth3 += counts[3];
  }

  console.log('\n=== Analyse de Profondeur (échantillon de 100 nœuds) ===');
  console.log(`Moyenne nœuds à profondeur 1: ${(totalDepth1 / sampleSize).toFixed(1)}`);
  console.log(`Moyenne nœuds à profondeur 2: ${(totalDepth2 / sampleSize).toFixed(1)}`);
  console.log(`Moyenne nœuds à profondeur 3: ${(totalDepth3 / sampleSize).toFixed(1)}`);
}

function printStats(poles, liaisons, nodeLiaisonCount) {
  const counts = Array.from(nodeLiaisonCount.values());
  const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
  const max = Math.max(...counts);
  const min = Math.min(...counts);

  const medianSorted = [...counts].sort((a, b) => a - b);
  const median = medianSorted[Math.floor(medianSorted.length / 2)];

  const distribution = {};
  counts.forEach(c => {
    const bucket = Math.floor(c / 5) * 5;
    const key = `${bucket}-${bucket + 4}`;
    distribution[key] = (distribution[key] || 0) + 1;
  });

  const themeCount = poles.filter(p => p.type === 'theme').length;
  const labCount = poles.filter(p => p.type === 'laboratoire').length;

  console.log('\n=== Statistiques ===');
  console.log(`Nombre de pôles: ${poles.length} (${themeCount} thèmes, ${labCount} labs)`);
  console.log(`Nombre de liaisons: ${liaisons.length}`);
  console.log(`Liaisons par nœud - Min: ${min}, Max: ${max}, Moyenne: ${avg.toFixed(2)}, Médiane: ${median}`);
  console.log('\nDistribution des liaisons par nœud:');
  Object.entries(distribution)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .forEach(([range, count]) => {
      const pct = ((count / poles.length) * 100).toFixed(1);
      console.log(`  ${range.padEnd(7)}: ${String(count).padStart(5)} nœuds (${pct}%)`);
    });
}

console.log('Génération des données de test avec profondeur...');
console.log(`Objectif: 50k liaisons avec chaînes profondes\n`);

const { poles, liaisons, nodeLiaisonCount } = generateData();
printStats(poles, liaisons, nodeLiaisonCount);
analyzeDepth(poles, liaisons);

console.log('\nCréation du fichier Excel...');
const outputPath = createExcelFile(poles, liaisons);
console.log(`Fichier créé: ${outputPath}`);
