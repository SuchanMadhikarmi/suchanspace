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

      content = content.replace(/borderborder/g, 'border');

      content = content.replace(/<(input|select|textarea)([^>]*)>/g, (match) => {
        let isClosing = match.startsWith('</');
        if (isClosing) return match;

        // Don't strip from certain input types where it might matter but let's try broadly first
        let bareMatch = match.replace(/\s*className="[^"]*"/g, '')
                             .replace(/\s*style=\{\{[^\}]*\}\}/g, '');
        
        return bareMatch.replace(/<(input|select|textarea)/, '<$1 className="input-field"');
      });

      let prevContent = '';
      while (content !== prevContent) {
        prevContent = content;
        content = content.replace(/(<[A-Za-z0-9_.-]+[^>]*?)\s*className="([^"]*)"([^>]*?)\s*className="([^"]*)"/g, '$1 className="$2 $4"$3');
      }

      prevContent = '';
      while (content !== prevContent) {
        prevContent = content;
        content = content.replace(/(<[A-Za-z0-9_.-]+[^>]*?)\s*style=\{\{([^}]*)\}\}([^>]*?)\s*style=\{\{([^}]*)\}\}/g, '$1 style={{$2, $4}}$3');
      }

      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir(path.join(__dirname, 'src/features/finance'));
console.log('Final syntax applied!');
