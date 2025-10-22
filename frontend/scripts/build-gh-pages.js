const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Build the app
console.log('Building React app...');
execSync('npm run build', { stdio: 'inherit' });

// Create .nojekyll file
console.log('Creating .nojekyll file...');
fs.writeFileSync(path.join(__dirname, '../build/.nojekyll'), '');

// Update index.html to work with GitHub Pages
const indexPath = path.join(__dirname, '../build/index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Add base URL for GitHub Pages
const repoName = 'real-time-collaborative-task-manager';
const baseUrl = `/${repoName}`;

indexContent = indexContent.replace(
  '<base href="%PUBLIC_URL%/">',
  `<base href="${baseUrl}/">`
);

fs.writeFileSync(indexPath, indexContent);
console.log('Build completed for GitHub Pages!');