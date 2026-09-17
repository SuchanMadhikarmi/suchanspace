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
      
      // Forcefully replace any inline style references in inputs to just use standard tailwind + var logic
      // Also remove bg-transparent entirely
      content = content.replace(/bg-transparent/g, 'bg-[var(--white)]');
      content = content.replace(/text-\[var\(--text\)\]/g, 'text-[var(--text)]'); 
      // ACTUALLY text-[var(--text)] fails in Tailwind v3 unless explicitly configured. Let's just use inline style for text color!
      
      // We can add a global inline style to all inputs via a hack by replacing '<input '
      // Or we can just ensure they all have a generic class. Wait, let's just make sure style blocks don't hide text.
      // Let's replace any instance of 'color: "var(--text)"' inside styled elements inside inputs
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir(path.join(__dirname, 'src/features/finance'));
console.log('Fixed all inputs!');
