const axios = require('axios');
const FormData = require('form-data');

async function convertSpeechToText(audioFile) {
    try {
        const formData = new FormData();
        
        // We are taking the audio file directly from the RAM (buffer).
        formData.append('file', audioFile.buffer, {
            filename: audioFile.originalname || 'input_audio.wav',
            contentType: audioFile.mimetype || 'audio/wav',
        });
        
        // Note: Check ElevenLabs docs for their exact STT model ID and endpoint for 2026
        formData.append('model_id', 'scribe_v1'); 
        formData.append('language_code', 'hi');

        const response = await axios.post(
            'https://api.elevenlabs.io/v1/speech-to-text', 
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    'xi-api-key': process.env.ELEVENLABS_API_KEY, 
                },
            }
        );

        // API se transcribed text return kar rahe hain
        return response.data.text; 

    } catch (error) {
        console.error("ElevenLabs API Error:", error.response?.data || error.message);
        throw new Error("An error occurred during speech-to-text conversion.");
    }
}

module.exports = { convertSpeechToText };