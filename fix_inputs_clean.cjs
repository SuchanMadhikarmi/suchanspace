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
      
      // Step 1: Remove completely ALL inline style tags from <input> and <select> tags
      content = content.replace(/(<(input|select)[^>]*?)style=\{\{[^\}]*\}\}([^>]*?>)/g, '$1$3');
      content = content.replace(/(<(input|select)[^>]*?)style=\{\{[^\}]*\}\}([^>]*?>)/g, '$1$3'); // Double check
      content = content.replace(/(<(input|select)[^>]*?)style=\{\{[^\}]*\}\}([^>]*?>)/g, '$1$3');

      // Step 2: Add specific class to inputs and selects to force styling instead of relying on inline styles
      content = content.replace(/<(input|select)([^>]*?)className="([^"]*)"([^>]*?)>/g, '<$1$2className="$3 input-field"$4>');
      
      // Handle the cases where they don't have a className initially
      content = content.replace(/<(input|select)(?![^>]*?className=)([^>]*?)>/g, '<$1 className="input-field"$2>');

      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir(path.join(__dirname, 'src/features/finance'));
console.log('Fixed inputs cleanly!');
