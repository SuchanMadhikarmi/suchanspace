const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Specifically target inputs and add style tag unconditionally
      content = content.replace(/<input([^>]*?)>/g, (match) => {
          if (!match.includes('style={{')) {
              return match.replace('<input ', '<input style={{ backgroundColor: "var(--bg)", color: "var(--text)" }} ');
          } else {
              // Inject backgroundColor and color into existing style
              return match.replace(/style=\{\{/, 'style={{ backgroundColor: "var(--bg)", color: "var(--text)", ');
          }
      });

      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir(path.join(__dirname, 'src/features/finance'));
console.log('Fixed inputs deeply!');
