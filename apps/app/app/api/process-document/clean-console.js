const fs = require('fs');

// Read the file
const filePath = 'route.ts';
const content = fs.readFileSync(filePath, 'utf8');

// Split into lines
const lines = content.split('\n');
const cleanedLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Skip lines that are just console statements
  if (line.trim().startsWith('console.')) {
    continue;
  }
  
  // Handle multi-line console statements
  if (line.includes('console.log(') || 
      line.includes('console.error(') || 
      line.includes('console.warn(') ||
      line.includes('console.debug(')) {
    
    // Check if it's a complete statement on one line
    const openParens = (line.match(/\(/g) || []).length;
    const closeParens = (line.match(/\)/g) || []).length;
    
    if (openParens === closeParens) {
      // Complete statement, skip it
      continue;
    } else {
      // Multi-line statement, skip until we find the closing
      let parenCount = openParens - closeParens;
      while (parenCount > 0 && i < lines.length - 1) {
        i++;
        const nextLine = lines[i];
        parenCount += (nextLine.match(/\(/g) || []).length;
        parenCount -= (nextLine.match(/\)/g) || []).length;
      }
      continue;
    }
  }
  
  // Keep all other lines
  cleanedLines.push(line);
}

// Write back
fs.writeFileSync(filePath, cleanedLines.join('\n'));
console.log('Cleaned console statements from', filePath);