#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('Starting web application with database migrations...');

// Run migrations first
const migrateProcess = spawn('npm', ['run', 'migrate'], {
  cwd: path.join(__dirname, '../..'),
  stdio: 'inherit',
  shell: true
});

migrateProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`Migration process exited with code ${code}`);
    process.exit(code);
  }

  console.log('Migrations completed successfully. Starting Next.js...');

  // Start Next.js
  const nextProcess = spawn('npm', ['run', 'start', '--workspace=@boat-monitor/web'], {
    cwd: path.join(__dirname, '../..'),
    stdio: 'inherit',
    shell: true
  });

  nextProcess.on('close', (nextCode) => {
    process.exit(nextCode);
  });
});

migrateProcess.on('error', (error) => {
  console.error('Failed to start migration process:', error);
  process.exit(1);
});
