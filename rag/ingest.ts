import { GosuChunker } from './chunker';
import { glob } from 'glob';
import * as path from 'path';
import * as fs from 'fs';
import { ChromaClient, Collection } from 'chromadb';

async function main() {
    const chunker = new GosuChunker();
    const client = new ChromaClient(); // Defaults to http://localhost:8000
    let collection: Collection | undefined;

    try {
        console.log("Connecting to ChromaDB...");
        collection = await client.getOrCreateCollection({
            name: "guidewire-codebase",
            metadata: { "description": "Gosu codebase chunks" }
        });
        console.log("Connected to ChromaDB.");
    } catch (e) {
        console.warn("Could not connect to ChromaDB (is it running?). Proceeding with DRY RUN (saving to JSON only).");
    }

    const pattern = '../gsrc/**/*.gs';
    console.log(`Searching for Gosu files matching: ${pattern}`);
    const files = await glob(pattern, { cwd: __dirname });
    console.log(`Found ${files.length} files.`);

    // Process in batches
    const BATCH_SIZE = 50;
    const allChunks: any[] = [];

    for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch ${i / BATCH_SIZE + 1}/${Math.ceil(files.length / BATCH_SIZE)}...`);

        const batchDocuments: string[] = [];
        const batchMetadatas: any[] = [];
        const batchIds: string[] = [];

        for (const file of batch) {
            const absPath = path.resolve(sourcePath, file);
            try {
                const chunks = await chunker.parseFile(absPath);

                for (const chunk of chunks) {
                    const id = `${chunk.file_path}:${chunk.start_line}-${chunk.end_line}`;

                    // Prepare for Chroma
                    batchDocuments.push(`${chunk.context}\n\n${chunk.content}`); // Inject context into embedding text
                    batchMetadatas.push({
                        source: chunk.file_path,
                        start_line: chunk.start_line,
                        end_line: chunk.end_line,
                        type: chunk.node_type,
                        context: chunk.context
                    });
                    batchIds.push(id);

                    allChunks.push({
                        id,
                        text: chunk.content,
                        metadata: batchMetadatas[batchMetadatas.length - 1]
                    });
                }
            } catch (e: any) {
                // Ignore parsing errors (expected for some files)
                // console.warn(`Failed to parse ${path.basename(file)}: ${e.message}`);
            }
        }

        if (collection && batchIds.length > 0) {
            try {
                await collection.add({
                    ids: batchIds,
                    documents: batchDocuments,
                    metadatas: batchMetadatas,
                });
            } catch (e) {
                console.error("Failed to add batch to Chroma:", e);
            }
        }
    }

    console.log(`\nProcessed all files.`);
    console.log(`Total valid chunks extracted: ${allChunks.length}`);

    fs.writeFileSync('chunks.json', JSON.stringify(allChunks.slice(0, 100), null, 2)); // Save first 100 for inspection
    console.log("Saved first 100 chunks to chunks.json");
}

main().catch(console.error);
