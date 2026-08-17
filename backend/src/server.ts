// src/server.ts
import app from './app';
import { env } from './config/env';
import { connectDatabase } from './config/database';

async function start() {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Start HTTP server
    const port = parseInt(env.PORT, 10);
    app.listen(port, () => {
      console.log(`🚀 Vetrinel API server running on http://localhost:${port}`);
      console.log(`📋 Health check: http://localhost:${port}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();
