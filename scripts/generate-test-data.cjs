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

  const numNodes = Math.ceil((TOTAL_LIAISONS * 2) / TARGET_AVG_LIAISONS);
  const numThemes = Math.ceil(numNodes / 2);
  const numLabs = numNodes - numThemes;

  console.log(`Création de ${numThemes} thèmes et ${numLabs} labs...`);

  for (let i = 0; i < numThemes; i++) {
    createTheme();
  }
  for (let i = 0; i < numLabs; i++) {
    createLab();
  }

  console.log('Création des hubs (nœuds à 50 liaisons)...');
  const numHubThemes = 50;
  const numHubLabs = 50;
  const hubThemes = themes.slice(0, numHubThemes);
  const hubLabs = labs.slice(0, numHubLabs);

  hubThemes.forEach(theme => {
    const targetLabs = labs.filter(l => l !== theme).slice(0, MAX_LIAISONS_PER_NODE);
    targetLabs.forEach(lab => {
      addLiaison(theme, lab);
    });
  });

  hubLabs.forEach(lab => {
    let added = 0;
    for (let i = 0; i < themes.length && added < MAX_LIAISONS_PER_NODE; i++) {
      const theme = themes[i];
      if (addLiaison(lab, theme)) {
        added++;
      }
    }
  });

  console.log(`Liaisons après hubs: ${liaisons.length}`);

  function getTargetLiaisonCount() {
    const rand = Math.random();
    if (rand < 0.70) {
      return Math.floor(Math.random() * 6) + 7;
    } else if (rand < 0.90) {
      return Math.floor(Math.random() * 10) + 15;
    } else {
      return Math.floor(Math.random() * 20) + 26;
    }
  }

  const nodeTargets = new Map();
  poles.forEach(p => {
    const current = nodeLiaisonCount.get(p.id);
    if (current >= MAX_LIAISONS_PER_NODE) {
      nodeTargets.set(p.id, current);
    } else {
      nodeTargets.set(p.id, Math.max(current, getTargetLiaisonCount()));
    }
  });

  console.log('Génération des liaisons restantes...');

  const remainingThemes = themes.filter(t => nodeLiaisonCount.get(t.id) < MAX_LIAISONS_PER_NODE);
  const remainingLabs = labs.filter(l => nodeLiaisonCount.get(l.id) < MAX_LIAISONS_PER_NODE);

  const shuffledThemes = [...remainingThemes].sort(() => Math.random() - 0.5);
  const shuffledLabs = [...remainingLabs].sort(() => Math.random() - 0.5);

  let themeIdx = 0;
  let labIdx = 0;
  let lastProgress = 0;
  let stuckCount = 0;
  let lastLiaisonCount = liaisons.length;

  while (liaisons.length < TOTAL_LIAISONS) {
    const theme = shuffledThemes[themeIdx % shuffledThemes.length];
    const themeTarget = nodeTargets.get(theme.id);
    const themeCurrent = nodeLiaisonCount.get(theme.id);

    if (themeCurrent < themeTarget && themeCurrent < MAX_LIAISONS_PER_NODE) {
      let found = false;
      for (let attempts = 0; attempts < 50 && !found; attempts++) {
        const lab = shuffledLabs[(labIdx + attempts) % shuffledLabs.length];
        const labTarget = nodeTargets.get(lab.id);
        const labCurrent = nodeLiaisonCount.get(lab.id);

        if (labCurrent < labTarget && labCurrent < MAX_LIAISONS_PER_NODE) {
          if (addLiaison(theme, lab)) {
            labIdx++;
            found = true;
          }
        }
      }

      if (!found) {
        for (let i = 0; i < shuffledLabs.length && !found; i++) {
          const lab = shuffledLabs[i];
          if (nodeLiaisonCount.get(lab.id) < MAX_LIAISONS_PER_NODE) {
            if (addLiaison(theme, lab)) {
              found = true;
            }
          }
        }
      }
    }

    themeIdx++;

    if (themeIdx % shuffledThemes.length === 0) {
      shuffledThemes.sort(() => Math.random() - 0.5);
      shuffledLabs.sort(() => Math.random() - 0.5);
      labIdx = 0;

      if (liaisons.length === lastLiaisonCount) {
        stuckCount++;
        if (stuckCount > 10) {
          console.log('No progress, breaking...');
          break;
        }
      } else {
        stuckCount = 0;
        lastLiaisonCount = liaisons.length;
      }
    }

    const progress = Math.floor(liaisons.length / 10000) * 10000;
    if (progress > lastProgress) {
      console.log(`Progress: ${liaisons.length}/${TOTAL_LIAISONS} liaisons`);
      lastProgress = progress;
    }

    if (themeIdx > TOTAL_LIAISONS * 50) {
      console.log('Max iterations reached');
      break;
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

  const outputPath = path.join(__dirname, '..', 'test-data', 'test-50k-liaisons.xlsx');
  XLSX.writeFile(workbook, outputPath);

  return outputPath;
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

console.log('Génération des données de test avec 50k liaisons...');
console.log(`Objectif: ~${TARGET_AVG_LIAISONS} liaisons par nœud en moyenne, max ${MAX_LIAISONS_PER_NODE}\n`);

const { poles, liaisons, nodeLiaisonCount } = generateData();
printStats(poles, liaisons, nodeLiaisonCount);

console.log('\nCréation du fichier Excel...');
const outputPath = createExcelFile(poles, liaisons);
console.log(`Fichier créé: ${outputPath}`);
