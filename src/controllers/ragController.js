const { convertSpeechToText } = require('../services/sttService');
const { retrieveRelevantContext } = require('../services/retrievalService');
const { generateAnswerWithGuardrails } = require('../services/llmService');
const Groq = require('groq-sdk'); // STT aur LLM ke ilawa yahan bhi Groq import kar rahe hain

// Groq client initialize karo (Environment variable se key automatically utha lega)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function processQuery(audioFile) {
    console.log("🚀 RAG Pipeline Start...");
    const startTime = performance.now(); 

    try {
        // Phase 1: Speech to Text 
        const textQuery = await convertSpeechToText(audioFile);
        console.log(`🗣️ Transcribed Query: "${textQuery}"`);

        // 🚀 NAYA PHASE: Query Translation (Sirf Vector DB search ke liye)
        console.log("🔄 Translating query for Vector DB...");
        const translation = await groq.chat.completions.create({
            messages: [{ 
                role: "user", 
                content: `Translate the following text to English. ONLY output the English translation, no other text or explanation: "${textQuery}"` 
            }],
            model: 'openai/gpt-oss-120b' // Tumhara latest active model
        });
        
        const englishSearchQuery = translation.choices[0].message.content.trim();
        console.log(`🔍 English Search Query: "${englishSearchQuery}"`);

        // Phase 2: Vector DB Retrieval (Ab Pinecone mein English query jayegi)
        const context = await retrieveRelevantContext(englishSearchQuery);
        console.log(`📚 Retrieved Context Length: ${context.length} characters`);

        // Phase 3: LLM Generation (Lekin final answer generate karne ke liye original Hindi query hi bhejenge)
        const finalAnswer = await generateAnswerWithGuardrails(textQuery, context);
        console.log(`🤖 Final Answer: "${finalAnswer}"`);

        const endTime = performance.now();
        const latencyMs = Math.round(endTime - startTime);
        console.log(`⏱️ Total Pipeline Latency: ${latencyMs}ms`);

        return { 
            query: textQuery,
            answer: finalAnswer,
            latency_ms: latencyMs 
        };

    } catch (error) {
        console.error("Pipeline crash ho gayi:", error);
        return {
            error: "System mein kuch gadbad ho gayi. Kripya dobara try karein.",
            details: error.message
        };
    }
}

module.exports = { processQuery };