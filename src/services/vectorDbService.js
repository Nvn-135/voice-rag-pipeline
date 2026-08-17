const { Pinecone } = require('@pinecone-database/pinecone');
const { HuggingFaceInferenceEmbeddings } = require("@langchain/community/embeddings/hf");
const dotenv = require('dotenv');
dotenv.config();


const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

const embeddingsModel = new HuggingFaceInferenceEmbeddings({
    apiKey: process.env.HUGGINGFACE_API_KEY,
    model: "sentence-transformers/all-MiniLM-L6-v2"
});

async function storeChunksInPinecone(chunksWithMetadata) {
    console.log("We are starting to push data to Pinecone (REST API mode)...");

    try {
        const texts = chunksWithMetadata.map(chunk => chunk.pageContent);
        const embeddings = await embeddingsModel.embedDocuments(texts);
        
        const vectorsToUpsert = [];
        
        for (let i = 0; i < chunksWithMetadata.length; i++) {
            let vectorValues = embeddings[i];
            let cleanValues = Array.isArray(vectorValues) ? vectorValues.flat(Infinity).map(Number) : Array.from(vectorValues).map(Number);

            const safeMetadata = { text: chunksWithMetadata[i].pageContent };
            const rawMeta = chunksWithMetadata[i].metadata || {};
            
            for (const [key, value] of Object.entries(rawMeta)) {
                if (value === null || value === undefined) continue;
                safeMetadata[key] = (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') 
                    ? value 
                    : JSON.stringify(value);
            }

            if (cleanValues.length > 0 && !cleanValues.some(isNaN)) {
                vectorsToUpsert.push({
                    id: `chunk_${Date.now()}_${i}`,
                    values: cleanValues,
                    metadata: safeMetadata
                });
            }
        }

        console.log(`Total valid vectors to upsert: ${vectorsToUpsert.length}`);
        if (vectorsToUpsert.length === 0) throw new Error("No valid vector remained after data formatting..");

        
        console.log("The API is being called directly, bypassing the standard route...");
        
        // 1. Retrieving the dynamic host URL for your Pinecone index
        const indexInfo = await pc.describeIndex(process.env.PINECONE_INDEX);
        const hostUrl = `https://${indexInfo.host}/vectors/upsert`;

        // 2. Direct REST call 
        const response = await fetch(hostUrl, {
            method: 'POST',
            headers: {
                'Api-Key': process.env.PINECONE_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                vectors: vectorsToUpsert
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Pinecone API HTTP Error: ${errorData}`);
        }

        console.log("✅ All chunks have been successfully stored via the drinking REST API!");
        return true;

    } catch (error) {
        console.error("Error in the drinking rest setup:", error);
        throw error;
    }
}

module.exports = { storeChunksInPinecone };