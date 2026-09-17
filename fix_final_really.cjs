const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/features/finance/**/*.tsx');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // We are looking for something exactly like:
  // className="input-field"
  // ... and then another className="..."
  
  // Actually, why not just remove className="input-field" if it's there
  // and append "input-field" to the OTHER className? Let's just do a while loop to merge any duplicates.
  
  let changed = true;
  while (changed) {
    changed = false;
    content = content.replace(/(<\w+[^>]*?)\s+className="([^"]*)"([^>]*?)\s+className="([^"]*)"/s, (match, p1, p2, p3, p4) => {
      changed = true;
      let combined = Array.from(new Set(`${p2} ${p4}`.split(/\s+/))).filter(Boolean).join(' ');
      return `${p1} className="${combined}"${p3}`;
    });
    
    content = content.replace(/(<\w+[^>]*?)\s+style=\{\{([^}]*)\}\}([^>]*?)\s+style=\{\{([^}]*)\}\}/s, (match, p1, p2, p3, p4) => {
      changed = true;
      return `${p1} style={{${p2}, ${p4}}}${p3}`;
    });
  }

  if (content !== original) {
    fs.writeFileSync(file, content);
  }
}
