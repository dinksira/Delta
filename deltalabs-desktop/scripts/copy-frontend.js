const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "..", "..", "deltalabs-frontend", "out");
const destDir = path.join(__dirname, "..", "dist", "out");

function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) {
    console.error(`Source directory does not exist: ${from}`);
    return;
  }
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  fs.readdirSync(from).forEach((element) => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  });
}

console.log(`Copying frontend from ${srcDir} to ${destDir}...`);
copyFolderSync(srcDir, destDir);
console.log("Frontend copied successfully!");
