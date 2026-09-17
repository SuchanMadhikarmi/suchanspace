const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/features/finance/components/networth');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const fullPath = path.join(dir, file);
  let content = fs.readFileSync(fullPath, 'utf8');

  // Remove duplicate style tag
  content = content.replace(/style=\{\{ background: "var\(--green\)", color: "var\(--bg\)" \}\} style=\{\{ background: "var\(--green\)", color: "var\(--bg\)" \}\}/, 'style={{ background: "var(--green)", color: "var(--bg)" }}');
  
  // Actually, wait, let's just make the files prettier by formatting with standard tool
  fs.writeFileSync(fullPath, content);
}
console.log('Done');
