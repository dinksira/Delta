const { spawn } = require("child_process");
const vite = require("vite");
const path = require("path");

async function start() {
  console.log("Starting Vite development server...");
  
  // Programmatically start Vite server on port 4000
  const server = await vite.createServer({
    configFile: path.resolve(__dirname, "..", "vite.config.mts"),
    server: {
      port: 4000,
      strictPort: true,
    }
  });
  
  await server.listen();
  console.log("Vite server running at http://localhost:4000");

  console.log("Compiling Electron Main & Preload TypeScript files...");
  
  // Run TypeScript compiler once to build Main and Preload files to /dist
  const tsc = spawn("npx", ["tsc"], { stdio: "inherit", shell: true, cwd: path.resolve(__dirname, "..") });
  
  tsc.on("close", (code) => {
    if (code !== 0) {
      console.error("TypeScript compilation failed. Exiting.");
      server.close();
      process.exit(code);
    }
    
    console.log("TypeScript compilation completed. Launching Electron...");
    
    // Launch Electron process
    const electronBin = process.platform === "win32" ? "npx.cmd" : "npx";
    const electronProcess = spawn(electronBin, ["electron", "."], { 
      stdio: "inherit", 
      shell: true,
      cwd: path.resolve(__dirname, "..")
    });
    
    electronProcess.on("close", () => {
      console.log("Electron window closed. Stopping dev server.");
      server.close();
      process.exit(0);
    });
  });
}

start().catch(err => {
  console.error("Error during dev startup:", err);
  process.exit(1);
});
