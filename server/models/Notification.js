import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    targetRole: { type: String, index: true },
    employeeId: String,
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: 'info' },
    priority: { type: String, default: 'normal' },
    readAt: Date,
    metadata: { type: Object, default: {} }
  },
  { timestamps: true }
);

export const Notification = mongoose.model('Notification', notificationSchema);
