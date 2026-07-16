const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function replacePadding() {
  walkDir('/home/pawan/Desktop/gym_ERP/frontend/src/app/(erp)', function(file) {
    if (file.endsWith('.tsx')) {
      let content = fs.readFileSync(file, 'utf8');
      if (content.includes('className="p-6 ')) {
        content = content.replace(/className="p-6 /g, 'className="p-4 sm:p-6 ');
      }
      if (content.includes('className="p-6"')) {
        content = content.replace(/className="p-6"/g, 'className="p-4 sm:p-6"');
      }
      fs.writeFileSync(file, content);
    }
  });
  console.log("Done");
}
replacePadding();
