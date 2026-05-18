const fs = require('fs');
const path = require('path');

// Simple checker: ensures src/styles.css does not contain section-level background declarations
// that would override the global `--bg` background. Fails if `background:` or `background-image:`
// appear in selectors that include "provider-header" or "provider-section".

const cssPath = path.join(__dirname, '..', 'src', 'styles.css');
if (!fs.existsSync(cssPath)) {
  console.error('styles.css not found:', cssPath);
  process.exit(2);
}

const css = fs.readFileSync(cssPath, 'utf8');

const problematicSelectors = ['provider-header', 'provider-section', '.provider-header', '.provider-section'];
let problems = [];

for (const sel of problematicSelectors) {
  const regex = new RegExp(sel + "[^{]*\\{[^}]*\\b(background|background-image)\b[^}]*\}", 'gi');
  const match = css.match(regex);
  if (match) problems.push(...match);
}

if (problems.length) {
  console.error('Uniform background check FAILED. Found section-level background declarations:');
  problems.forEach(p=>console.error('-', p.trim()));
  process.exit(1);
}

console.log('Uniform background check PASSED. No section-level background declarations found.');
process.exit(0);
