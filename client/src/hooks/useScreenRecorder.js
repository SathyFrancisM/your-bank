import { useEffect, useRef, useState } from 'react';
import { readJson, writeJson } from '../utils/storage.js';

export const useScreenRecorder = (enabled, employee) => {
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const [active, setActive] = useState(false);
  const [recordings, setRecordings] = useState(() => readJson('bank_local_recordings', []));

  useEffect(() => {
    writeJson('bank_local_recordings', recordings);
  }, [recordings]);

  const start = async () => {
    if (!enabled || active || !navigator.mediaDevices?.getDisplayMedia) return false;
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    streamRef.current = stream;
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setRecordings((current) => [
        {
          id: crypto.randomUUID(),
          employeeName: employee?.name || 'Unknown',
          employeeId: employee?.employeeId || '',
          startTime: startedAtRef.current,
          endTime: new Date().toISOString(),
          fileUrl: url,
          status: 'Stopped'
        },
        ...current
      ].slice(0, 20));
      stream.getTracks().forEach((track) => track.stop());
      setActive(false);
    };
    recorderRef.current = recorder;
    startedAtRef.current = new Date().toISOString();
    recorder.start(1000);
    setActive(true);
    return true;
  };

  const startedAtRef = useRef(null);

  const stop = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setActive(false);
  };

  useEffect(() => () => stop(), []);

  return { active, start, stop, recordings, setRecordings };
};
