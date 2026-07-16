import { ScreenRecording } from '../models/ScreenRecording.js';

export const listRecordings = async (_req, res) => {
  const data = await ScreenRecording.find({}).sort({ createdAt: -1 }).limit(100);
  res.json({ data });
};

export const stopRecording = async (req, res) => {
  const recording = await ScreenRecording.findByIdAndUpdate(req.params.id, { status: 'Stopped', endTime: new Date() }, { new: true });
  if (!recording) {
    return res.status(404).json({ message: 'Recording not found' });
  }
  return res.json({ data: recording });
};
