// One-off: lift the header and footer blocks that every page currently
// duplicates into partials/, tokenising the paths that differ between the
// root pages and news/. Run once; after this, build.js owns the injection.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'about.html'), 'utf8');

// Root-relative asset and page paths become {{BASE}}-prefixed so a page in
// news/ can render the same partial with "../".
const tokenise = s => s
  .replace(/(href|src)="(logo\.webp|css\/|js\/|images\/|index\.html|about\.html|leadership\.html|news\/)/g,
           (_, attr, p) => `${attr}="{{BASE}}${p}`);

function slice(start, end, label) {
  const a = src.indexOf(start);
  const b = src.indexOf(end, a);
  if (a < 0 || b < 0) throw new Error(`could not locate ${label} (${a}, ${b})`);
  return src.slice(a, b).trimEnd() + '\n';
}

// Header: the utility bar through the end of the mobile drawer, i.e. up to <main>.
const header = slice('<!-- ============================================================\n     1) TOP UTILITY BAR', '<main>', 'header');

// Footer: the footer comment through the closing tag, plus the shared scripts.
const footer = slice('<!-- ============================================================\n     15) FOOTER', '</footer>', 'footer') + '</footer>\n';

fs.mkdirSync(path.join(ROOT, 'partials'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'partials', 'header.html'), tokenise(header));
fs.writeFileSync(path.join(ROOT, 'partials', 'footer.html'), tokenise(footer));

console.log(`header.html  ${header.split('\n').length} lines`);
console.log(`footer.html  ${footer.split('\n').length} lines`);
