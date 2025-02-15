import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, Mic, Square } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL|| "http://localhost:3000";

const MediaUploadUI = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptions, setTranscriptions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      await uploadToBackend(file);
    }
  };
  

  const uploadToBackend = async (file) => {
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);

      // const response = await axios.post('http://localhost:3000/transcribe', formData, {
      //   headers: { 'Content-Type': 'multipart/form-data' },
      // });
      const response = await axios.post(`${API_BASE_URL}/transcribe`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setTranscriptions((prev) => [
        ...prev,
        { type: 'file', name: file.name, text: response.data.text, timestamp: new Date().toLocaleString() },
      ]);
    } catch (err) {
      setError('Error uploading file: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], 'recording.webm', { type: 'audio/webm' });

        await uploadToBackend(file);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      setError('');
    } catch (err) {
      setError('Microphone access denied: Please enable microphone permissions');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold">Audio Upload & Recording</h2>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex gap-4 justify-center">
          <div>
            <input type="file" id="file-upload" className="hidden" accept="audio/*" onChange={handleFileUpload} />
            <button
              onClick={() => document.getElementById('file-upload').click()}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 w-40"
            >
              <Upload className="w-4 h-4 mr-2" /> Upload Audio
            </button>
          </div>

          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex items-center px-4 py-2 rounded-md focus:outline-none w-40 ${
              isRecording ? 'bg-red-500 hover:bg-red-600' : 'border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {isRecording ? <Square className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
            {isRecording ? 'Stop' : 'Record'}
          </button>
        </div>

        {loading && <div className="text-center text-blue-500">Processing...</div>}

        {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">{error}</div>}

        <div>
          <h3 className="text-lg font-medium mb-3">Transcriptions</h3>
          <div className="space-y-2">
            {transcriptions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No transcriptions yet.</div>
            ) : (
              transcriptions.map((item, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {item.type === 'file' ? <Upload className="w-4 h-4 text-gray-500" /> : <Mic className="w-4 h-4 text-gray-500" />}
                      <span className="font-medium">{item.type === 'file' ? item.name : 'Recording'}</span>
                    </div>
                    <span className="text-sm text-gray-500">{item.timestamp}</span>
                  </div>
                  {item.text && <div className="text-sm text-gray-700 mt-2">Transcription: {item.text}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaUploadUI;
