const { spawn } = require('child_process');
const { createInterface } = require('readline');

// Start the MCP server
const server = spawn('node', ['../dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Create readline interface for stdin
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

// Handle server output
server.stdout.on('data', (data) => {
  console.log(`Server: ${data}`);
});

server.stderr.on('data', (data) => {
  console.error(`Server Error: ${data}`);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

// Function to send a request to the server
function sendRequest(request) {
  server.stdin.write(JSON.stringify(request) + '\n');
}

// Test recent logs
console.log('Testing recent logs...');
sendRequest({
  method: 'callTool',
  params: {
    name: 'getLogs',
    args: {
      logType: 'recentLogs',
      limit: 5
    }
  }
});

// Test sign-in logs
console.log('\nTesting sign-in logs...');
sendRequest({
  method: 'callTool',
  params: {
    name: 'getLogs',
    args: {
      logType: 'signinLogs',
      limit: 3
    }
  }
});

// Handle user input
rl.on('line', (input) => {
  try {
    const request = JSON.parse(input);
    sendRequest(request);
  } catch (e) {
    console.error('Invalid JSON input');
  }
});

// Handle cleanup
process.on('SIGINT', () => {
  server.kill();
  rl.close();
  process.exit();
}); 