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
      
      content = content.replace(/<select([^>]*?)>/g, (match) => {
          if (!match.includes('style={{')) {
              return match.replace('<select ', '<select style={{ backgroundColor: "var(--bg)", color: "var(--text)" }} ');
          } else {
              return match.replace(/style=\{\{/, 'style={{ backgroundColor: "var(--bg)", color: "var(--text)", ');
          }
      });

      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir(path.join(__dirname, 'src/features/finance'));
console.log('Fixed selects deeply!');
