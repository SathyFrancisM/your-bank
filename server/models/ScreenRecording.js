import mongoose from 'mongoose';

const screenRecordingSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: Date,
    status: { type: String, enum: ['Active', 'Stopped'], default: 'Active' },
    fileName: String,
    fileUrl: String,
    notes: String
  },
  { timestamps: true }
);

export const ScreenRecording = mongoose.model('ScreenRecording', screenRecordingSchema);
