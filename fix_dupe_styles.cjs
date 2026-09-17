const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');

      content = content.replace(/(style=\{\{ background: "var\(--bg\)", color: "var\(--text\)", borderColor: "var\(--border\)" \}\})\s+style=\{\{ background: "var\(--bg\)", color: "var\(--text\)", borderColor: "var\(--border\)" \}\}/g, '$1');
      content = content.replace(/(style=\{\{ background: "var\(--bg\)", color: "var\(--text\)", borderColor: "var\(--border\)" \}\})\s+style=\{\{ borderColor: "var\(--border\)" \}\}/g, '$1');

      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir(path.join(__dirname, 'src/features/finance'));
console.log('Fixed duplications!');
