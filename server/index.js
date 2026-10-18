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
    origin: env.CLIENT_URLS,
    credentials: true
  }
});

setSocketServer(io);
setRecordingSocketServer(io);
setSecuritySocketServer(io);

await connectDatabase();

if (!process.env.VERCEL) {
  httpServer.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
}

export default httpServer;
