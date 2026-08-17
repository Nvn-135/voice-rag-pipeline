const cors = require('cors');
const express = require('express');
const multer = require('multer');
const dotenv = require('dotenv');
const { processQuery } = require('./controllers/ragController');

dotenv.config();
const app = express();
const port = 3000;
app.use(cors());


const upload = multer({ storage: multer.memoryStorage() }); 

// Main endpoint
app.post('/api/ask', upload.single('audio_input'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Audio file is required" });
        }
        
        
        const response = await processQuery(req.file);
        res.json({ success: true, data: response });

    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});