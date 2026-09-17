const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/features/finance/**/*.tsx');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // We have tags like <input \n className="input-field" \n ... \n className="other" ... \n />
  // We want to combine duplicate className properties within a tag.

  content = content.replace(/<[A-Za-z0-9_.-]+[^>]*>/g, (tag) => {
    // extract all classNames
    const classRegex = /className="([^"]*)"/g;
    let match;
    let classes = [];
    while ((match = classRegex.exec(tag)) !== null) {
      classes.push(match[1]);
    }
    
    // extract all styles (simplified)
    const styleRegex = /style=\{\{([^\}]*)\}\}/g;
    let styles = [];
    while ((match = styleRegex.exec(tag)) !== null) {
      styles.push(match[1]);
    }

    if (classes.length <= 1 && styles.length <= 1) return tag;

    // Remove all classNames and styles
    let newTag = tag.replace(/\s*className="[^"]*"/g, '');
    newTag = newTag.replace(/\s*style=\{\{[^\}]*\}\}/g, '');

    // Re-insert combined classNames
    if (classes.length > 0) {
      const combinedClasses = Array.from(new Set(classes.join(' ').split(/\s+/))).filter(Boolean).join(' ');
      newTag = newTag.replace(/<([A-Za-z0-9_.-]+)/, `<$1 className="${combinedClasses}"`);
    }

    // Re-insert combined styles
    if (styles.length > 0) {
      const combinedStyles = styles.join(', ');
      newTag = newTag.replace(/<([A-Za-z0-9_.-]+)/, `<$1 style={{${combinedStyles}}}`);
    }

    return newTag;
  });

  if (content !== original) {
    fs.writeFileSync(file, content);
  }
}
