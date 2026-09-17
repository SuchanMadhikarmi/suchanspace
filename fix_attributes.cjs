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
      
      // Merge multiple classNames
      content = content.replace(/className="([^"]*)"([^>]*?)className="([^"]*)"/g, 'className="$1 $3"$2');
      content = content.replace(/className="([^"]*)"([^>]*?)className="([^"]*)"/g, 'className="$1 $3"$2');

      // Also clean up duplicated attributes if there are any others, though duplicate properties was object literal.
      // Above fixed <input className="" className="">
      
      // While we are at it, ensure multiple attributes with the same name are merged or cleared
      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir(path.join(__dirname, 'src/features/finance'));
console.log('Fixed attributes!');
