import { ScreenRecording } from '../models/ScreenRecording.js';
import { demoMode } from '../config/db.js';
import { store } from '../services/store.js';

export const listRecordings = async (_req, res) => {
  if (demoMode) {
    const data = store.find('screenrecordings', {}, { limit: 100 });
    return res.json({ data });
  }
  try {
    const data = await ScreenRecording.find({}).sort({ createdAt: -1 }).limit(100);
    return res.json({ data });
  } catch {
    const data = store.find('screenrecordings', {}, { limit: 100 });
    return res.json({ data });
  }
};

export const stopRecording = async (req, res) => {
  if (demoMode) {
    const recording = store.findByIdAndUpdate('screenrecordings', req.params.id, {
      status: 'Stopped',
      endTime: new Date().toISOString()
    }, { new: true });
    if (!recording) return res.status(404).json({ message: 'Recording not found' });
    return res.json({ data: recording });
  }

  try {
    const recording = await ScreenRecording.findByIdAndUpdate(req.params.id, { status: 'Stopped', endTime: new Date() }, { new: true });
    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }
    return res.json({ data: recording });
  } catch {
    const recording = store.findByIdAndUpdate('screenrecordings', req.params.id, {
      status: 'Stopped',
      endTime: new Date().toISOString()
    }, { new: true });
    if (!recording) return res.status(404).json({ message: 'Recording not found' });
    return res.json({ data: recording });
  }
};
