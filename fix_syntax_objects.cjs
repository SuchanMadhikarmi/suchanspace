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
      
      // Fix duplicate object literal properties
      content = content.replace(/backgroundColor:\s*"var\(--bg\)",\s*backgroundColor:\s*"var\(--bg\)",/g, 'backgroundColor: "var(--bg)",');
      content = content.replace(/color:\s*"var\(--text\)",\s*color:\s*"var\(--text\)",/g, 'color: "var(--text)",');
      content = content.replace(/backgroundColor:\s*"var\(--bg\)",\s*backgroundColor:\s*"var\(--white\)",/g, 'backgroundColor: "var(--white)",');
      content = content.replace(/backgroundColor:\s*"var\(--white\)",\s*backgroundColor:\s*"var\(--white\)",/g, 'backgroundColor: "var(--white)",');
      content = content.replace(/color:\s*"var\(--text\)",\s*color:\s*"var\(--green\)",/g, 'color: "var(--green)",');
      
      // Additional cleanups for other duplicate properties this might have caused
      content = content.replace(/backgroundColor:\s*"[^"]*",\s*backgroundColor:\s*"([^"]*)",/g, 'backgroundColor: "$1",');
      content = content.replace(/color:\s*"[^"]*",\s*color:\s*"([^"]*)",/g, 'color: "$1",');
      
      // Fix multiple attributes with the same name
      content = content.replace(/style=\{\{.*?\}\}\s*style=\{\{/g, (match) => {
          // just combine them
          let first = match.split('style={{')[1].split('}}')[0].trim();
          let second = 'style={{';
          return 'style={{ ' + first + ', ';
      });
      content = content.replace(/style=\{\{\s*\}\}/g, '');
      content = content.replace(/,\s*,/g, ',');

      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir(path.join(__dirname, 'src/features/finance'));
console.log('Fixed syntax objects!');
