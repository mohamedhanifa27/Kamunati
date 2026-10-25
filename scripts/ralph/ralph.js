#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const scriptDir = __dirname;
const prdFile = path.join(scriptDir, 'prd.json');
const progressFile = path.join(scriptDir, 'progress.txt');
const archiveDir = path.join(scriptDir, 'archive');
const lastBranchFile = path.join(scriptDir, '.last-branch');

// Parse arguments
const args = process.argv.slice(2);
let tool = 'claude'; // default to claude on node
let maxIterations = 10;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--tool' && args[i + 1]) {
    tool = args[i + 1];
    i++;
  } else if (args[i].startsWith('--tool=')) {
    tool = args[i].split('=')[1];
  } else if (/^\d+$/.test(args[i])) {
    maxIterations = parseInt(args[i], 10);
  }
}

// Archive previous run if branch changed
if (fs.existsSync(prdFile) && fs.existsSync(lastBranchFile)) {
  try {
    const prdData = JSON.parse(fs.readFileSync(prdFile, 'utf8'));
    const currentBranch = prdData.branchName || '';
    const lastBranch = fs.readFileSync(lastBranchFile, 'utf8').trim();

    if (currentBranch && lastBranch && currentBranch !== lastBranch) {
      const dateStr = new Date().toISOString().slice(0, 10);
      const folderName = lastBranch.replace(/^ralph\//, '');
      const archiveFolder = path.join(archiveDir, `${dateStr}-${folderName}`);

      console.log(`Archiving previous run: ${lastBranch}`);
      fs.mkdirSync(archiveFolder, { recursive: true });
      fs.copyFileSync(prdFile, path.join(archiveFolder, 'prd.json'));
      if (fs.existsSync(progressFile)) {
        fs.copyFileSync(progressFile, path.join(archiveFolder, 'progress.txt'));
      }
      console.log(`  Archived to: ${archiveFolder}`);

      fs.writeFileSync(progressFile, `# Ralph Progress Log\nStarted: ${new Date().toISOString()}\n---\n`);
    }
  } catch (e) {
    // ignore parse error
  }
}

// Track current branch
if (fs.existsSync(prdFile)) {
  try {
    const prdData = JSON.parse(fs.readFileSync(prdFile, 'utf8'));
    if (prdData.branchName) {
      fs.writeFileSync(lastBranchFile, prdData.branchName.trim());
    }
  } catch {}
}

if (!fs.existsSync(progressFile)) {
  fs.writeFileSync(progressFile, `# Ralph Progress Log\nStarted: ${new Date().toISOString()}\n---\n`);
}

console.log(`Starting Ralph - Tool: ${tool} - Max iterations: ${maxIterations}`);

for (let i = 1; i <= maxIterations; i++) {
  console.log(`\n===============================================================`);
  console.log(`  Ralph Iteration ${i} of ${maxIterations} (${tool})`);
  console.log(`===============================================================`);

  let promptContent = '';
  if (tool === 'claude') {
    promptContent = fs.readFileSync(path.join(scriptDir, 'CLAUDE.md'), 'utf8');
  } else {
    promptContent = fs.readFileSync(path.join(scriptDir, 'prompt.md'), 'utf8');
  }

  // Check if all stories are already passed
  if (fs.existsSync(prdFile)) {
    try {
      const prd = JSON.parse(fs.readFileSync(prdFile, 'utf8'));
      const pending = (prd.userStories || []).filter(s => !s.passes);
      if (pending.length === 0) {
        console.log('\nAll PRD stories are marked as passes: true! Complete.');
        break;
      }
      console.log(`Stories remaining: ${pending.length}`);
    } catch {}
  }

  try {
    let result;
    if (tool === 'claude') {
      result = spawnSync('claude', ['--dangerously-skip-permissions', '--print'], {
        input: promptContent,
        stdio: ['pipe', 'inherit', 'inherit'],
        encoding: 'utf8',
        shell: true
      });
    } else {
      result = spawnSync('amp', ['--dangerously-allow-all'], {
        input: promptContent,
        stdio: ['pipe', 'inherit', 'inherit'],
        encoding: 'utf8',
        shell: true
      });
    }
  } catch (err) {
    console.error(`Iteration error:`, err.message);
  }
}
