const { convertSpeechToText } = require('../services/sttService');
const { retrieveRelevantContext } = require('../services/retrievalService');
const { generateAnswerWithGuardrails } = require('../services/llmService');

async function processQuery(audioFile) {
    console.log("🚀 RAG Pipeline Start...");
    const startTime = performance.now(); // Latency 

    try {
        // Phase 1: Speech to Text 
        const textQuery = await convertSpeechToText(audioFile);
        console.log(`🗣️ Transcribed Query: "${textQuery}"`);

        // Phase 2: Vector DB Retrieval 
        const context = await retrieveRelevantContext(textQuery);
        console.log(`📚 Retrieved Context Length: ${context.length} characters`);

        // Phase 3: LLM Generation with Guardrails 
        const finalAnswer = await generateAnswerWithGuardrails(textQuery, context);
        console.log(`🤖 Final Answer: "${finalAnswer}"`);

        const endTime = performance.now();
        const latencyMs = Math.round(endTime - startTime);
        console.log(`⏱️ Total Pipeline Latency: ${latencyMs}ms`);

        return { 
            query: textQuery,
            answer: finalAnswer,
            latency_ms: latencyMs // Submission analytics 
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