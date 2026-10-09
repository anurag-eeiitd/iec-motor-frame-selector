import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('public/data', { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'selector.js', 'data/abb-frsm69a.json']) {
  await copyFile(file, `public/${file}`);
}
await copyFile('.nojekyll', 'public/.nojekyll');
console.log('Static website prepared in public/');
