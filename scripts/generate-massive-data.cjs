const XLSX = require('xlsx');
const path = require('path');

const TOTAL_LIAISONS = 500000;
const MAX_LIAISONS_PER_NODE = 50;

function generateNodeId(type, index) {
  return `${type}_${String(index).padStart(6, '0')}`;
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

  function createTheme(name) {
    const nodeId = generateNodeId('THEME', themeCount++);
    const node = { id: nodeId, nom: name || `Thème ${themeCount}`, type: 'theme' };
    poles.push(node);
    themes.push(node);
    nodeLiaisonCount.set(nodeId, 0);
    return node;
  }

  function createLab(name) {
    const nodeId = generateNodeId('LAB', labCount++);
    const node = { id: nodeId, nom: name || `Laboratoire ${labCount}`, type: 'laboratoire' };
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

  console.log('Phase 1: Création de mega-hubs (nœuds centraux)...');
  const megaHubs = [];
  for (let i = 0; i < 200; i++) {
    megaHubs.push(createTheme(`Hub Principal ${i + 1}`));
    megaHubs.push(createLab(`Centre de Recherche ${i + 1}`));
  }

  console.log('Phase 2: Création des réseaux hiérarchiques...');
  const numNetworks = 500;

  for (let n = 0; n < numNetworks; n++) {
    const rootTheme = createTheme(`Réseau ${n + 1} - Racine`);

    const level1 = [];
    for (let i = 0; i < 5; i++) {
      const lab = createLab(`R${n + 1} - Branche ${i + 1}`);
      addLiaison(rootTheme, lab);
      level1.push(lab);
    }

    for (const l1 of level1) {
      const level2 = [];
      for (let i = 0; i < 4; i++) {
        const theme = createTheme(`R${n + 1} - Sous-thème ${level1.indexOf(l1) + 1}.${i + 1}`);
        addLiaison(l1, theme);
        level2.push(theme);
      }

      for (const l2 of level2) {
        for (let i = 0; i < 3; i++) {
          const lab = createLab(`R${n + 1} - Lab ${level2.indexOf(l2) + 1}.${i + 1}`);
          addLiaison(l2, lab);

          if (Math.random() < 0.3) {
            const hub = megaHubs[Math.floor(Math.random() * megaHubs.length)];
            if (hub.type !== lab.type) {
              addLiaison(lab, hub);
            }
          }
        }
      }
    }

    if (n > 0 && Math.random() < 0.7) {
      const prevNetworkNodes = poles.slice(
        Math.max(0, poles.length - 200),
        poles.length - 50
      );
      const bridgeNode = prevNetworkNodes[Math.floor(Math.random() * prevNetworkNodes.length)];
      if (bridgeNode && bridgeNode.type !== rootTheme.type) {
        addLiaison(bridgeNode, rootTheme);
      }
    }

    if (n % 50 === 0) {
      console.log(`  Réseaux créés: ${n}/${numNetworks}`);
    }
  }

  console.log(`Liaisons après réseaux: ${liaisons.length}`);

  console.log('Phase 3: Création de chaînes longues...');
  const numChains = 1000;
  const chainLength = 30;

  for (let c = 0; c < numChains; c++) {
    let prevNode = Math.random() < 0.5 ? createTheme() : createLab();

    for (let i = 1; i < chainLength; i++) {
      const newNode = prevNode.type === 'theme' ? createLab() : createTheme();
      addLiaison(prevNode, newNode);

      if (i % 5 === 0 && Math.random() < 0.5) {
        const hub = megaHubs[Math.floor(Math.random() * megaHubs.length)];
        if (hub.type !== newNode.type) {
          addLiaison(newNode, hub);
        }
      }

      prevNode = newNode;
    }

    if (c % 200 === 0) {
      console.log(`  Chaînes créées: ${c}/${numChains}`);
    }
  }

  console.log(`Liaisons après chaînes: ${liaisons.length}`);

  console.log('Phase 4: Création de clusters denses...');
  const numClusters = 300;
  const clusterSize = 30;

  for (let cl = 0; cl < numClusters; cl++) {
    const clusterThemes = [];
    const clusterLabs = [];

    for (let i = 0; i < clusterSize; i++) {
      if (i % 2 === 0) {
        clusterThemes.push(createTheme(`Cluster ${cl + 1} - T${i / 2 + 1}`));
      } else {
        clusterLabs.push(createLab(`Cluster ${cl + 1} - L${Math.floor(i / 2) + 1}`));
      }
    }

    for (const theme of clusterThemes) {
      const numConnections = Math.floor(Math.random() * 6) + 3;
      const shuffledLabs = [...clusterLabs].sort(() => Math.random() - 0.5);

      for (let i = 0; i < Math.min(numConnections, shuffledLabs.length); i++) {
        addLiaison(theme, shuffledLabs[i]);
      }
    }

    if (Math.random() < 0.6) {
      const hub = megaHubs[Math.floor(Math.random() * megaHubs.length)];
      const connector = clusterThemes[0] || clusterLabs[0];
      if (hub.type !== connector.type) {
        addLiaison(hub, connector);
      }
    }

    if (cl % 50 === 0) {
      console.log(`  Clusters créés: ${cl}/${numClusters}`);
    }
  }

  console.log(`Liaisons après clusters: ${liaisons.length}`);

  console.log('Phase 5: Connexions inter-structures...');

  const allThemes = themes.filter(t => nodeLiaisonCount.get(t.id) < MAX_LIAISONS_PER_NODE);
  const allLabs = labs.filter(l => nodeLiaisonCount.get(l.id) < MAX_LIAISONS_PER_NODE);

  let attempts = 0;
  const maxAttempts = TOTAL_LIAISONS * 3;

  while (liaisons.length < TOTAL_LIAISONS && attempts < maxAttempts) {
    const theme = allThemes[Math.floor(Math.random() * allThemes.length)];
    const lab = allLabs[Math.floor(Math.random() * allLabs.length)];

    if (theme && lab &&
        nodeLiaisonCount.get(theme.id) < MAX_LIAISONS_PER_NODE &&
        nodeLiaisonCount.get(lab.id) < MAX_LIAISONS_PER_NODE) {
      addLiaison(theme, lab);
    }

    attempts++;

    if (liaisons.length % 50000 === 0) {
      console.log(`  Progress: ${liaisons.length}/${TOTAL_LIAISONS} liaisons`);
    }
  }

  return { poles, liaisons, nodeLiaisonCount };
}

function createExcelFile(poles, liaisons) {
  console.log('Création du fichier Excel (peut prendre du temps)...');

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

  const outputPath = path.join(__dirname, '..', 'test-data', 'test-500k-complex.xlsx');
  XLSX.writeFile(workbook, outputPath);

  return outputPath;
}

function analyzeDepth(poles, liaisons) {
  console.log('\nAnalyse de la profondeur du graphe...');

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
    const depthCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };

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

  const sampleSize = Math.min(50, poles.length);
  const sampleIndices = new Set();
  while (sampleIndices.size < sampleSize) {
    sampleIndices.add(Math.floor(Math.random() * poles.length));
  }

  let total = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const idx of sampleIndices) {
    const counts = bfs(poles[idx].id, 4);
    for (const d of [1, 2, 3, 4]) {
      total[d] += counts[d];
    }
  }

  console.log('\n=== Analyse de Profondeur (échantillon de 50 nœuds) ===');
  console.log(`Moyenne nœuds à profondeur 1: ${(total[1] / sampleSize).toFixed(1)}`);
  console.log(`Moyenne nœuds à profondeur 2: ${(total[2] / sampleSize).toFixed(1)}`);
  console.log(`Moyenne nœuds à profondeur 3: ${(total[3] / sampleSize).toFixed(1)}`);
  console.log(`Moyenne nœuds à profondeur 4: ${(total[4] / sampleSize).toFixed(1)}`);
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
    const bucket = Math.floor(c / 10) * 10;
    const key = `${bucket}-${bucket + 9}`;
    distribution[key] = (distribution[key] || 0) + 1;
  });

  const themeCount = poles.filter(p => p.type === 'theme').length;
  const labCount = poles.filter(p => p.type === 'laboratoire').length;

  console.log('\n=== Statistiques ===');
  console.log(`Nombre de pôles: ${poles.length.toLocaleString()} (${themeCount.toLocaleString()} thèmes, ${labCount.toLocaleString()} labs)`);
  console.log(`Nombre de liaisons: ${liaisons.length.toLocaleString()}`);
  console.log(`Liaisons par nœud - Min: ${min}, Max: ${max}, Moyenne: ${avg.toFixed(2)}, Médiane: ${median}`);
  console.log('\nDistribution des liaisons par nœud:');
  Object.entries(distribution)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .forEach(([range, count]) => {
      const pct = ((count / poles.length) * 100).toFixed(1);
      console.log(`  ${range.padEnd(7)}: ${String(count).padStart(6)} nœuds (${pct}%)`);
    });
}

console.log('='.repeat(60));
console.log('Génération de données massives et complexes');
console.log(`Objectif: ${TOTAL_LIAISONS.toLocaleString()} liaisons`);
console.log('='.repeat(60));

const startTime = Date.now();
const { poles, liaisons, nodeLiaisonCount } = generateData();
printStats(poles, liaisons, nodeLiaisonCount);
analyzeDepth(poles, liaisons);

console.log('\n' + '='.repeat(60));
const outputPath = createExcelFile(poles, liaisons);
const duration = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\nTerminé en ${duration}s`);
console.log(`Fichier créé: ${outputPath}`);
