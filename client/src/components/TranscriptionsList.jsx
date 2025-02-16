
import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";


const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Fetch Transcriptions
const TranscriptionsList = () => {
  const [transcriptions, setTranscriptions] = useState([]);

  useEffect(() => {
    const fetchTranscriptions = async () => {
      try {
        console.log("API URL:", API_BASE_URL);
        //const response = await axios.get("http://localhost:3000/transcriptions");
        const response = await axios.get(`${API_BASE_URL}/transcriptions`);
        setTranscriptions(response.data);
      } catch (error) {
        console.error("Error fetching transcriptions:", error);
      }
    };

    fetchTranscriptions();
  }, []);

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-lg shadow-lg p-6">
      {/* Title */}
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">
        Transcription History
      </h2>

      {/* No Transcriptions Message */}
      {transcriptions.length === 0 ? (
        <p className="text-gray-500 text-center">No transcriptions available.</p>
      ) : (
        <div className="space-y-4">
          {transcriptions.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-4 bg-gray-50 rounded-lg shadow border border-gray-200"
            >
              <p className="text-gray-800">{t.text}</p>
              <span className="text-sm text-gray-500">
                {new Date(t.created_at).toLocaleString()}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TranscriptionsList;
