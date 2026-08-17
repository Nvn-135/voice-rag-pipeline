let mediaRecorder;
let audioChunks = [];
let isRecording = false;

const recordBtn = document.getElementById('recordBtn');
const statusText = document.getElementById('statusText');
const outputArea = document.getElementById('outputArea');
const transcriptionText = document.getElementById('transcriptionText');
const answerText = document.getElementById('answerText');
const latencyText = document.getElementById('latencyText');

recordBtn.addEventListener('click', toggleRecording);

async function toggleRecording() {
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.addEventListener('dataavailable', event => {
            audioChunks.push(event.data);
        });

        mediaRecorder.addEventListener('stop', sendAudioToBackend);

        mediaRecorder.start();
        isRecording = true;
        
        recordBtn.classList.add('recording');
        recordBtn.innerHTML = '<i class="fas fa-stop"></i>';
        statusText.innerText = "Listening... Tap to stop.";
        statusText.style.color = "#ff0055";
        
        // Hide previous output
        outputArea.classList.add('hidden');

    } catch (error) {
        console.error("Microphone access denied:", error);
        statusText.innerText = "Error: Microphone access required.";
    }
}

function stopRecording() {
    mediaRecorder.stop();
    isRecording = false;
    
    recordBtn.classList.remove('recording');
    recordBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    statusText.innerText = "Processing Neural Data...";
    statusText.style.color = "#00f3ff";
    
    // Stop all microphone tracks to release the mic icon in browser
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
}

async function sendAudioToBackend() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    const formData = new FormData();
    formData.append('audio_input', audioBlob, 'recording.wav');

    try {
        // Backend URL (Ensure your node server is running on port 3000)
        const response = await fetch('http://localhost:3000/api/ask', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error("Backend server error");

        const result = await response.json();
        
        if(result.success) {
            displayResults(result.data);
        } else {
            throw new Error(result.error || "Failed to process query");
        }

    } catch (error) {
        console.error("API Error:", error);
        statusText.innerText = "System Error: Connection Failed.";
        statusText.style.color = "#ff0055";
    }
}

function displayResults(data) {
    statusText.innerText = "System Ready. Tap to Speak.";
    statusText.style.color = "#8a9bb8";
    
    transcriptionText.innerText = data.query || "No transcription found.";
    answerText.innerText = data.answer || "No response generated.";
    latencyText.innerText = `${data.latency_ms || '-- '} ms`;

    outputArea.classList.remove('hidden');
}