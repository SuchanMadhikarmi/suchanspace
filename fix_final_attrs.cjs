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
      
      // loop until no multiple classNames in same tag
      // Simple hack: read file, split by '<', merge classNames within the tag
      let parts = content.split('<');
      for (let i = 1; i < parts.length; i++) {
         let tagSplit = parts[i].split('>');
         let tag = tagSplit[0];
         
         let classRegex = /className="([^"]*)"/g;
         let match;
         let classes = [];
         while ((match = classRegex.exec(tag)) !== null) {
            classes.push(match[1].trim());
         }
         
         if (classes.length > 1) {
            // remove all classNames
            tag = tag.replace(/className="[^"]*"\s*/g, '');
            // append merged className
            tag += ` className="${classes.join(' ')}"`;
            tagSplit[0] = tag;
            parts[i] = tagSplit.join('>');
         }
      }
      content = parts.join('<');

      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir(path.join(__dirname, 'src/features/finance'));
console.log('Fixed final attrs!');
