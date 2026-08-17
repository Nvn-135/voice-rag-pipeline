const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");

async function createSmartChunks(rawText) {
    console.log("The chunking process is starting...");

    // This splitter splits the text first based on paragraphs (\n\n), then sentences (\n), and finally words.
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,     // Approximately 500 characters per chunk
        chunkOverlap: 100,    // Each chunk will overlap the previous chunk by 100 characters so that the context is not broken.
        separators: ["\n\n", "\n", ".", "!", "?", " ", ""], 
    });

    try {
        const chunks = await textSplitter.createDocuments([rawText]);
        console.log(`Total ${chunks.length} Chunks have been successfully created.`);
        
        // Metadata adding....
        const chunksWithMetadata = chunks.map((chunk, index) => ({
            ...chunk,
            metadata: {
                ...chunk.metadata,
                chunk_id: index,
                source: "MSMARCO-XI_dataset",
                chunking_strategy: "Recursive_Overlap"
            }
        }));

        return chunksWithMetadata;
    } catch (error) {
        console.error("An error occurred during chunking:", error);
        throw error;
    }
}

module.exports = { createSmartChunks };