const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function fixGrids() {
  walkDir('/home/pawan/Desktop/gym_ERP/frontend/src/app/(erp)', function(file) {
    if (file.endsWith('.tsx')) {
      let content = fs.readFileSync(file, 'utf8');
      if (content.includes('className="grid grid-cols-2 ')) {
        content = content.replace(/className="grid grid-cols-2 /g, 'className="grid grid-cols-1 sm:grid-cols-2 ');
      }
      fs.writeFileSync(file, content);
    }
  });
  console.log("Grids fixed");
}
fixGrids();
