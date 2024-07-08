import { closeDBConnection } from "./core/neo4j"
import { insertDataIntoDB } from "./process/ingest/ingest"
import { Codebase } from "./process/prepare/codebase"
import { FileProcessor } from "./process/prepare/processor/file"

async function main() {
	const codebase = new Codebase("./project2", new FileProcessor(), 1)
	await codebase.process()
	await codebase.embed()

	await insertDataIntoDB(codebase.embeddingsDirPath, 1)

	closeDBConnection()
}

main()
