import { io } from 'socket.io-client';

const socket = io('http://localhost:5001');

socket.on('connect', () => {
  console.log('Connected to socket server');
});

socket.on('donationClaimed', (data) => {
  console.log('RECEIVED donationClaimed event:');
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
});

socket.on('connect_error', (err) => {
  console.error('Socket connection error:', err);
  process.exit(1);
});

// Timeout after 20 seconds
setTimeout(() => {
  console.error('Timed out waiting for donationClaimed event');
  process.exit(1);
}, 20000);
