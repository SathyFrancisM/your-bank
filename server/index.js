import { createServer } from 'http';
import { Server } from 'socket.io';
import { app } from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { setSocketServer } from './services/notificationService.js';
import { setRecordingSocketServer } from './services/recordingService.js';
import { setSecuritySocketServer } from './services/securityEngine.js';

const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: {
    origin: env.CLIENT_URL,
    credentials: true
  }
});

setSocketServer(io);
setRecordingSocketServer(io);
setSecuritySocketServer(io);

const start = async () => {
  await connectDatabase();
  httpServer.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
};

start();
