import { ScreenRecording } from '../models/ScreenRecording.js';
import { demoMode } from '../config/db.js';

let socketServer = null;

export const setRecordingSocketServer = (server) => {
  socketServer = server;
};

export const startRecordingSession = async ({ employeeId, employeeName, fileName = '', fileUrl = '', notes = '' }) => {
  if (demoMode) {
    return {
      _id: `demo-recording-${Date.now()}`,
      employeeId,
      employeeName,
      startTime: new Date(),
      status: 'Active',
      fileName,
      fileUrl,
      notes,
      demoMode: true
    };
  }
  const recording = await ScreenRecording.create({
    employeeId,
    employeeName,
    startTime: new Date(),
    status: 'Active',
    fileName,
    fileUrl,
    notes
  });

  if (socketServer) {
    socketServer.emit('recording:start', recording);
  }

  return recording;
};

export const stopRecordingSession = async (recordingId) => {
  const recording = await ScreenRecording.findByIdAndUpdate(
    recordingId,
    { endTime: new Date(), status: 'Stopped' },
    { new: true }
  );

  if (socketServer && recording) {
    socketServer.emit('recording:stop', recording);
  }

  return recording;
};
