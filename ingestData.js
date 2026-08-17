const fs = require('fs');
const { storeChunksInPinecone } = require('./src/services/vectorDbService');

async function ingestAuthenticDataset() {
    console.log("They are pushing data from local JSON samples into the Pinecone...");

    try {
        // Reading a JSON file created by a Python script
        const rawData = fs.readFileSync('msmarco_sample.json', 'utf8');
        const msMarcoSample = JSON.parse(rawData);

        
        const chunksWithMetadata = msMarcoSample.map((row) => {
            return {
                
                pageContent: row.english_content, 
                metadata: {
                    source: "MSMARCO-XI-Hindi-Train",
                    query_id: row.row_id,
                    translated_passage: row.content, 
                    text: row.english_content
                }
            };
        });

        console.log(`Successfully ${chunksWithMetadata.length} I have formatted the genuine rows.`);
        console.log("Data sample:", chunksWithMetadata[0].pageContent.substring(0, 80) + "...");

        //  The new batching code starts here.
        const batchSize = 100; 
        console.log(`Total ${chunksWithMetadata.length} records are ${batchSize} sending in batching...`);

        for (let i = 0; i < chunksWithMetadata.length; i += batchSize) {
            const batch = chunksWithMetadata.slice(i, i + batchSize);
            
            try {
                await storeChunksInPinecone(batch); 
                console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} successfully uploaded!`);
            } catch (error) {
                console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} error occur:`, error.message);
            }
        }
        

        console.log("✅ The sample of the actual MSMARCO dataset has been successfully pushed to the pinecone!");

    } catch (error) {
        console.error("An error occurred during dataset ingestion:", error);
    }
}

ingestAuthenticDataset();