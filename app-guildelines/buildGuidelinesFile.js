const fs = require('fs');
const path = require('path');

// read all files in the current directory
const files = fs.readdirSync(__dirname);

const filesContent = files.map(file => {
    if (file === 'buildGuidelinesFile.js') return '';
    if (file === 'project-guidelines.md') return '';
    
    const filePath = path.join(__dirname, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return `## ${file}\n\n${fileContent}`;
}); 

fs.writeFileSync(path.join(__dirname, 'project-guidelines.md'), filesContent.join('\n\n'));

// Get the project root directory (one level up from __dirname)
// const projectRoot = path.join(__dirname, '..');

// copy project-guidelines.md to .cursor/rules folder in the project root
// const cursorRulesDir = path.join(projectRoot, '.cursor', 'rules');
// fs.copyFileSync(path.join(__dirname, 'project-guidelines.md'), );
// fs.writeFileSync(path.join(cursorRulesDir, 'project-guidelines.mdc'), filesContent.join('\n\n'));


// copy project-guidelines.md to .windsurfrules file
// fs.copyFileSync(path.join(__dirname, 'project-guidelines.md'), path.join(projectRoot, '.windsurfrules'));
