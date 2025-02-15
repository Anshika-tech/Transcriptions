
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

//app.use(cors());

app.use(cors({
    origin: "http://localhost:5173",  // Replace with your frontend URL in production
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }));
  
app.use(express.json());

const upload = multer({ dest: "uploads/" });

const DEEPINFRA_API_URL = 'https://api.deepinfra.com/v1/openai/audio/transcriptions';
const API_KEY = process.env.DEEPINFRA_API_KEY;


const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

//  Transcribe & Save to Supabase
app.post('/transcribe', upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(req.file.path));
        formData.append('model', 'openai/whisper-medium');

        const response = await axios.post(DEEPINFRA_API_URL, formData, {
            headers: { 'Authorization': `Bearer ${API_KEY}`, ...formData.getHeaders() },
        });

        const transcription = response.data.text;
        const timestamp = new Date().toISOString();

        // Save transcription to Supabase
        const { data, error } = await supabase
            .from('transcriptions')
            .insert([{ text: transcription, created_at: timestamp }]);

        if (error) {
            console.error('Supabase Insert Error:', error);
            return res.status(500).json({ error: 'Error saving transcription' });
        }


        res.json({ text: transcription });
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Error transcribing audio' });
    }
});

//  Fetch Transcriptions from Supabase
app.get('/transcriptions', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('transcriptions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase Fetch Error:', error);
            return res.status(500).json({ error: 'Error fetching transcriptions' });
        }

        res.json(data);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Error retrieving transcriptions' });
    }
});

app.get("/", async (req, res) => {
    return res.json("hi i am live yo");
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
