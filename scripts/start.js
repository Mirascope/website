#!/usr/bin/env node

const { spawn } = require("child_process");
const port = process.argv[2] || "3000";

spawn("bun", ["--bun", "vite", "--port", port], { stdio: "inherit" });
