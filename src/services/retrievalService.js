const { HuggingFaceInferenceEmbeddings } = require("@langchain/community/embeddings/hf");
const dotenv = require('dotenv');
dotenv.config();

const embeddingsModel = new HuggingFaceInferenceEmbeddings({
    apiKey: process.env.HUGGINGFACE_API_KEY,
    model: "sentence-transformers/all-MiniLM-L6-v2"
});

async function retrieveRelevantContext(userQuery) {
    console.log(`They are searching in Pinecone. "${userQuery}"...`);

    try {
        // 1. Convert user's question from embedding model to vector on the fly
        const queryVector = await embeddingsModel.embedQuery(userQuery);
        let cleanQueryVector = Array.isArray(queryVector) ? queryVector.flat(Infinity).map(Number) : Array.from(queryVector).map(Number);

        // 2. Direct REST API call for maximum speed (Target: < 200ms)
        const response = await fetch(`https://${process.env.PINECONE_HOST}/query`, {
            method: 'POST',
            headers: {
                'Api-Key': process.env.PINECONE_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                vector: cleanQueryVector,
                topK: 5, 
                includeMetadata: true
            })
        });

        if (!response.ok) {
            throw new Error(`Pinecone Query Error: ${await response.text()}`);
        }

        const data = await response.json();
        
        // 3. Extract just the text from the retrieved chunks and create a single large string.
        if (data.matches && data.matches.length > 0) {
            const context = data.matches.map(match => match.metadata.text).join("\n\n");
            return context;
        } else {
            return ""; 
        }

    } catch (error) {
        console.error("Error in Retrieval Service:", error);
        throw error;
    }
}

module.exports = { retrieveRelevantContext };