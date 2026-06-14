const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');

const replacements = [
  { regex: /bg-gradient-to-br from-slate-300 to-cyan-300(?!\s+dark:)/g, replacement: 'bg-gradient-to-br from-slate-300 to-cyan-300 dark:from-slate-900 dark:to-slate-800' },
  { regex: /bg-gradient-to-r from-cyan-600 to-blue-600(?!\s+dark:)/g, replacement: 'bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-800 dark:to-blue-800' },
  { regex: /bg-slate-50(?!\s+dark:)(?!\/)/g, replacement: 'bg-slate-50 dark:bg-slate-900' },
  { regex: /bg-slate-100(?!\s+dark:)(?!\/)/g, replacement: 'bg-slate-100 dark:bg-slate-950' },
  { regex: /bg-white(?!\s+dark:)(?!\/)/g, replacement: 'bg-white dark:bg-slate-800 dark:text-slate-100' },
  { regex: /text-slate-900(?!\s+dark:)(?!\/)/g, replacement: 'text-slate-900 dark:text-slate-100' },
  { regex: /text-slate-800(?!\s+dark:)(?!\/)/g, replacement: 'text-slate-800 dark:text-slate-200' },
  { regex: /text-slate-700(?!\s+dark:)(?!\/)/g, replacement: 'text-slate-700 dark:text-slate-300' },
  { regex: /text-slate-600(?!\s+dark:)(?!\/)/g, replacement: 'text-slate-600 dark:text-slate-400' },
  { regex: /text-slate-500(?!\s+dark:)(?!\/)/g, replacement: 'text-slate-500 dark:text-slate-400' },
  { regex: /border-slate-200(?!\s+dark:)(?!\/)/g, replacement: 'border-slate-200 dark:border-slate-700' },
  { regex: /border-slate-300(?!\s+dark:)(?!\/)/g, replacement: 'border-slate-300 dark:border-slate-600' },
  { regex: /bg-slate-700(?!\s+dark:)(?!\/)/g, replacement: 'bg-slate-700 dark:bg-slate-950' },
  { regex: /hover:bg-slate-50(?!\s+dark:)(?!\/)/g, replacement: 'hover:bg-slate-50 dark:hover:bg-slate-800' },
  { regex: /hover:bg-slate-100(?!\s+dark:)(?!\/)/g, replacement: 'hover:bg-slate-100 dark:hover:bg-slate-700' }
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  replacements.forEach(r => {
    content = content.replace(r.regex, r.replacement);
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${path.basename(filePath)}`);
  }
}

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      traverse(filePath);
    } else if (filePath.endsWith('.jsx')) {
      processFile(filePath);
    }
  }
}

traverse(pagesDir);
console.log('Done!');
