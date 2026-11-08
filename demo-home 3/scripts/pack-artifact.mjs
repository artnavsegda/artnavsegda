// Собирает dist/ в одну страницу-артефакт: CSS и JS инлайном, фото — отдельными файлами рядом.
import { readFileSync, writeFileSync, readdirSync } from 'fs';
const dist = new URL('../dist/', import.meta.url);
const entry = process.argv[2] || 'index';
const html = readFileSync(new URL(entry + '.html', dist), 'utf8');
// файлы этой точки входа — по ссылкам из её html
const js = html.match(/assets\/([^"]+\.js)/)[1];
const css = html.match(/assets\/([^"]+\.css)/)[1];
const code = readFileSync(new URL('assets/' + js, dist), 'utf8').replace(/<\/script/gi, '<\\/script');
const style = readFileSync(new URL('assets/' + css, dist), 'utf8').replace(/<\/style/gi, '<\\/style');
const fonts = html.match(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]+>/)[0];
const title = { media: 'Медиацентр', house: 'Дом в разрезе' }[entry] ?? 'Демо-дом';
const page = `<title>${title}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
${fonts}
<style>${style}</style>
<div id="app"></div>
<script type="module">${code}</script>
`;
writeFileSync(new URL(entry === 'index' ? 'artifact.html' : entry + '-artifact.html', dist), page);
console.log('dist/' + entry, (page.length / 1024).toFixed(0) + ' KB');
