import { mkdir, copyFile } from 'node:fs/promises';
for (const folder of ['checkout-1', 'checkout-2']) {
  await mkdir(`public/${folder}`, { recursive: true });
  await copyFile(`${folder}/index.html`, `public/${folder}/index.html`);
}
await copyFile('hotmart.svg', 'public/hotmart.svg');
