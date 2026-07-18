const fs = require('fs');
const path = require('path');

function replaceGrid(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  // Basic regex to find opening grid divs
  const gridRegex = /<div\s+className={`?\"?[^\"]*grid\s+[^\"]*\"?`?}\s*>/g;
  const gridRegex2 = /<div\s+className=\"[^\"]*grid\s+[^\"]*\"\s*>/g;
  
  let match;
  let modifications = [];
  
  // We'll just find all matches from both regexes
  let matches = [];
  let m;
  while ((m = gridRegex.exec(content)) !== null) matches.push(m);
  while ((m = gridRegex2.exec(content)) !== null) matches.push(m);
  
  // Sort by index descending to replace from back to front without shifting indices
  matches.sort((a, b) => b.index - a.index);
  
  for (match of matches) {
    const startIdx = match.index;
    const tagLength = match[0].length;
    
    // Find matching closing div
    let stack = 1;
    let endIdx = startIdx + tagLength;
    
    while (endIdx < content.length && stack > 0) {
      if (content.substring(endIdx, endIdx + 4) === '<div') {
        stack++;
        endIdx += 4;
      } else if (content.substring(endIdx, endIdx + 6) === '</div>') {
        stack--;
        if (stack === 0) break;
        endIdx += 6;
      } else {
        endIdx++;
      }
    }
    
    if (stack === 0) {
      // Determine columns from class
      let cols = 1; // fallback
      const className = match[0];
      if (className.includes('cols-2')) cols = 2;
      else if (className.includes('cols-3')) cols = 3;
      else if (className.includes('cols-4')) cols = 4;
      else if (className.includes('cols-5')) cols = 5;
      
      modifications.push({
        start: startIdx,
        end: endIdx + 6,
        openingLength: tagLength,
        cols: cols
      });
    }
  }
  
  if (modifications.length === 0) return;
  
  for (const mod of modifications) {
    // Replace opening tag
    content = content.substring(0, mod.start) + '<DataGrid columns={' + mod.cols + '}>' + content.substring(mod.start + mod.openingLength);
    
    // The length changed due to opening tag replacement
    const diff = '<DataGrid columns={x}>'.length - mod.openingLength;
    const newEnd = mod.end + diff;
    
    // Replace closing tag
    content = content.substring(0, newEnd - 6) + '</DataGrid>' + content.substring(newEnd);
  }
  
  // Add import if needed
  if (!content.includes('import { DataGrid }')) {
    content = content.replace(/(import.*?;?\n)/, "$1import { DataGrid } from '@/components/layout/DataGrid';\n");
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Updated ' + filePath);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.tsx') && !p.includes('DataGrid.tsx')) replaceGrid(p);
  }
}

walk('x:/reps/apps/admin-web/src/pages');
