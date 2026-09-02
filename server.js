import { createServer } from 'vite';

// Simple server script for testing
createServer({
  root: 'path',
  server: {
    port: 5173,
    open: true,
    host: true
  }
}).then(server => {
  console.log('🚀 Server running at:', server.httpServer.address);
}).catch(err => {
  console.error('Failed to start server:', err);
});
