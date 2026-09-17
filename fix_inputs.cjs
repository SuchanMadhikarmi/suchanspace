const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/features/finance/components/networth');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const fullPath = path.join(dir, file);
  let content = fs.readFileSync(fullPath, 'utf8');

  // Fix inputs that have bg-transparent and text-[var(--text)]
  content = content.replace(/className="([^"]*)bg-transparent text-\[var\(--text\)\]([^"]*)"/g, 'className="$1 bg-white $2" style={{ color: "var(--text)" }}');
  content = content.replace(/style=\{\{ background: "var\(--bg\)", color: "var\(--text\)", borderColor: "var\(--border\)" \}\}/g, 'style={{ backgroundColor: "var(--white)", color: "var(--text)", borderColor: "var(--border)" }}');

  fs.writeFileSync(fullPath, content);
}
console.log('Inputs fixed');
