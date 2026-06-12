const { spawn, exec } = require('child_process');
const path = require('path');

const services = [
  {
    name: 'Super Admin Backend',
    dir: 'super-admin/backend',
    command: 'npm',
    args: ['run', 'dev'],
    color: '\x1b[36m' // Cyan
  },
  {
    name: 'Super Admin Frontend',
    dir: 'super-admin/frontend',
    command: 'npm',
    args: ['run', 'dev'],
    color: '\x1b[32m' // Green
  },
  {
    name: 'Restaurant Admin Backend',
    dir: 'restaurant/admin/backend',
    command: 'npm',
    args: ['run', 'dev'],
    color: '\x1b[35m' // Magenta
  },
  {
    name: 'Restaurant Admin Frontend',
    dir: 'restaurant/admin/frontend',
    command: 'npm',
    args: ['run', 'dev'],
    color: '\x1b[33m' // Yellow
  },
  {
    name: 'Customer App',
    dir: 'restaurant/customer',
    command: 'npm',
    args: ['run', 'dev'],
    color: '\x1b[34m' // Blue
  }
];

const children = [];
const RESET = '\x1b[0m';

console.log('🚀 Starting Smart Serve services...');

services.forEach(service => {
  const cwd = path.resolve(__dirname, service.dir);
  console.log(`Starting ${service.name} in ${cwd}...`);
  
  const child = spawn(service.command, service.args, {
    cwd,
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  child.stdout.on('data', data => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      console.log(`${service.color}[${service.name}]${RESET} ${line}`);
    });
  });
  
  child.stderr.on('data', data => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      console.error(`${service.color}[${service.name} ERROR]${RESET} ${line}`);
    });
  });
  
  child.on('close', code => {
    console.log(`${service.color}[${service.name}]${RESET} exited with code ${code}`);
  });
  
  children.push(child);
});

// Handle termination signals
const handleShutdown = () => {
  console.log('\n🛑 Stopping all services...');
  children.forEach(child => {
    if (child.pid) {
      if (process.platform === 'win32') {
        try {
          exec(`taskkill /pid ${child.pid} /T /F`);
        } catch (e) {
          child.kill();
        }
      } else {
        child.kill('SIGINT');
      }
    }
  });
  setTimeout(() => {
    process.exit();
  }, 1000);
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
