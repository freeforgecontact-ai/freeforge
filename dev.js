import { spawn } from 'child_process';

console.log('\x1b[35m%s\x1b[0m', '---------------------------------------------------');
console.log('\x1b[35m%s\x1b[0m', ' Démarrage de Local Premium Music (VibeLocal)... ');
console.log('\x1b[35m%s\x1b[0m', '---------------------------------------------------');

// Start Backend Server (Port 3001)
const server = spawn('node', ['server.js'], { 
  stdio: 'inherit', 
  shell: true 
});

// Start Frontend Client (Port 5173)
const client = spawn('npm', ['run', 'dev'], { 
  cwd: 'client', 
  stdio: 'inherit', 
  shell: true 
});

// Clean termination when interrupted
const cleanExit = () => {
  console.log('\nArrêt des serveurs...');
  server.kill('SIGINT');
  client.kill('SIGINT');
  process.exit(0);
};

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);
process.on('exit', cleanExit);
