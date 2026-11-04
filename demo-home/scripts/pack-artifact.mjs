// Собирает dist/ в одну страницу-артефакт: CSS и JS инлайном, фото — отдельными файлами рядом.
import { readFileSync, writeFileSync, readdirSync } from 'fs';
const dist = new URL('../dist/', import.meta.url);
const html = readFileSync(new URL('index.html', dist), 'utf8');
const js = readdirSync(new URL('assets/', dist)).find(f => f.endsWith('.js'));
const css = readdirSync(new URL('assets/', dist)).find(f => f.endsWith('.css'));
const code = readFileSync(new URL('assets/' + js, dist), 'utf8').replace(/<\/script/gi, '<\\/script');
const style = readFileSync(new URL('assets/' + css, dist), 'utf8').replace(/<\/style/gi, '<\\/style');
const fonts = html.match(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]+>/)[0];
const page = `<title>Демо-дом</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
${fonts}
<style>${style}</style>
<div id="app"></div>
<script type="module">${code}</script>
`;
writeFileSync(new URL('artifact.html', dist), page);
console.log('dist/artifact.html', (page.length / 1024).toFixed(0) + ' KB');
