
// Ce fichier doit être renommé en .cjs pour fonctionner avec require en mode CommonJS
// Renommez ce fichier en export-pages-structure.cjs puis lancez :
// node scripts/export-pages-structure.cjs <chemin_du_dossier>

const fs = require('fs');
const path = require('path');

function dirToJson(dir) {
  const stats = fs.statSync(dir);
  if (stats.isDirectory()) {
    return {
      name: path.basename(dir),
      type: 'folder',
      children: fs.readdirSync(dir)
        .filter(child => !child.startsWith('.'))
        .map(child => dirToJson(path.join(dir, child)))
    };
  } else {
    return {
      name: path.basename(dir),
      type: 'file'
    };
  }
}


// Utilisation : node export-pages-structure.js <chemin_du_dossier>
const inputDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, '../src/pages');
if (!fs.existsSync(inputDir)) {
  console.error('Dossier non trouvé :', inputDir);
  process.exit(1);
}
const tree = dirToJson(inputDir);
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}
const outputFile = path.join(outputDir, 'pages-structure.json');
fs.writeFileSync(outputFile, JSON.stringify(tree, null, 2));
console.log(`Structure du dossier exportée dans ${outputFile}`);
