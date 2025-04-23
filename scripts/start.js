#!/usr/bin/env node

const { spawn } = require("child_process");
const http = require("http");
const port = process.argv[2] || "3000";
const host = "127.0.0.1"; // Explicitly use IPv4 localhost address

// Check if the port is in use by trying to bind to the specific address
function checkPort(port) {
  return new Promise((resolve) => {
    const server = http.createServer();

    server.on("error", (e) => {
      if (e.code === "EADDRINUSE") {
        console.error(`Error: Port ${port} is already in use. Please try another port.`);
        resolve(false);
      } else {
        console.error(`Error checking port: ${e.message}`);
        resolve(false);
      }
    });

    // Bind to the same address we'll use for Vite
    server.listen(port, host, () => {
      server.close(() => {
        resolve(true);
      });
    });
  });
}

async function start() {
  console.log(`Checking if port ${port} is available on ${host}...`);
  const isAvailable = await checkPort(port);

  if (!isAvailable) {
    process.exit(1);
  } else {
    console.log(`Port ${port} is available. Starting server...`);
    // Force Vite to use the same host address we checked
    spawn("bun", ["--bun", "vite", "--port", port, "--host", host], { stdio: "inherit" });
  }
}

start();
