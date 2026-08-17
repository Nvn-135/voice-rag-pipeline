const Groq = require("groq-sdk");
const dotenv = require('dotenv');
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function generateAnswerWithGuardrails(userQuery, retrievedContext) {
    console.log("The context is being sent to Garok LLM...");

    // Hard Guardrail 1: If no context is found in the database, do not send the prompt to the model.
    if (!retrievedContext || retrievedContext.trim() === "") {
        return "I apologize, but the answer to this question is not in my knowledge base.";
    }

    // Soft Guardrail 2: System Prompt ke through strict instructions
    const systemPrompt = `You are a helpful, bilingual, voice-enabled AI assistant.

Strict Rules:
1. Answer the user's question ONLY using the facts provided in the Context below.
2. If the Context does not contain the answer, you must reply exactly with: "I don't know the answer to this." Do not guess or hallucinate.
3. LANGUAGE & SCRIPT RULES:
   - If the user asks in English, answer entirely in English.
   - If the user asks in Hindi or Urdu (regardless of whether the input text is in Devanagari, Roman, or Arabic/Urdu script), you MUST answer entirely in Hindi using ONLY the Devanagari script (हिंदी). 
   - NEVER use the Arabic/Urdu script in your responses.
4. Keep your answer concise, conversational, and direct (suitable for voice output).

    Context:
    ${retrievedContext}
    `;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userQuery }
            ],
            model: "llama-3.3-70b-versatile", 
            temperature: 0.1, 
            max_tokens: 1024, 
        });

        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error("Groq API error:", error);
        throw new Error("There was a problem generating the answer..");
    }
}

module.exports = { generateAnswerWithGuardrails };