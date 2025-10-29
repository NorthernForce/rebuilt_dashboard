const express = require('express');
const path = require('path');
const { Client } = require('wpilib-nt-client');

const app = express();
const PORT = 5800;

// Parse JSON bodies
app.use(express.json());

// Serve static files
app.use(express.static('public'));
app.use('/src', express.static('src'));

// Main route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`Dashboard server running on http://localhost:${PORT}`);
});

// NetworkTables client for robot communication
const ntClient = new Client();

// Try to connect to robot (team 172)
// Will work with real robot, simulation, or localhost
const robotAddresses = [
  '10.1.72.2',      // Robot on field
  'roboRIO-172-FRC.local',  // mDNS
  'localhost',      // Simulation
  '127.0.0.1'       // Simulation fallback
];

let connected = false;
let currentAddress = null;

function connectToRobot() {
  if (connected) return;
  
  const address = robotAddresses.find(() => true); // Try first address
  
  ntClient.start((isConnected, connectionInfo) => {
    if (isConnected) {
      connected = true;
      currentAddress = connectionInfo.remote_ip;
      console.log(`Connected to robot at ${connectionInfo.remote_ip}`);
      console.log('NetworkTables client ready');
      setupNetworkTablesListeners();
    } else {
      connected = false;
      console.log('Waiting for robot connection...');
      setTimeout(connectToRobot, 3000);
    }
  }, robotAddresses[0]);
}

function setupNetworkTablesListeners() {
  // Dashboard will read these NetworkTables entries
  console.log('Listening for NetworkTables updates from robot');
  console.log('Robot should publish to these tables:');
  console.log('  - /Dashboard/FMS/*');
  console.log('  - /Dashboard/Telemetry/*');
  console.log('  - /Dashboard/Auto/*');
  console.log('  - /Dashboard/Scoring/*');
  console.log('  - /Dashboard/Alignment/*');
  console.log('  - /Dashboard/MatchState');
}

// Start connection attempt
connectToRobot();

// Expose NetworkTables client globally for API endpoints
global.ntClient = ntClient;

// API endpoint to get NetworkTables data
app.get('/api/nt/:table', (req, res) => {
  const tableName = req.params.table;
  try {
    const value = ntClient.getValue(`/Dashboard/${tableName}`);
    res.json({ value });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to set NetworkTables data (for sending commands to robot)
app.post('/api/nt/Dashboard/Commands/:command', (req, res) => {
  const command = req.params.command;
  const data = req.body;
  
  try {
    // Set the command data in NetworkTables
    ntClient.Update(`/Dashboard/Commands/${command}`, data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

console.log('NetworkTables client initialized for FRC communication');
