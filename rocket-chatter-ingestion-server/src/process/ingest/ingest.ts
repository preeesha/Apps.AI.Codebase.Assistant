import { readdirSync } from "fs"
import { readFile } from "fs/promises"
import path from "path"

import { v4 as uuid } from "uuid"
import { RC_APP_URI } from "../../constants"
import { DBNode } from "../../core/dbNode"

namespace Algorithms {
	export async function emptyDB(): Promise<boolean> {
		try {
			const res = await fetch(`${RC_APP_URI}/empty`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			})

			return res.status === 200
		} catch (e) {
			console.log(e);
			return false
		}
	}

	export async function insertBatch(batchID: string, nodes: DBNode[]): Promise<boolean> {
		try {
			const res = await fetch(`${RC_APP_URI}/ingest`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ nodes, batchID }),
			})

			return res.status === 200
		} catch (e) {
			console.log(e);
			return false
		}
	}
}

export async function insertDataIntoDB(embeddingsPath: string) {
	console.log("🕒 Inserting")

	const files = readdirSync(embeddingsPath).map((file) =>
		path.resolve(embeddingsPath, file)
	)

	/* Step 1: Empty DB */
	{
		const success = await Algorithms.emptyDB()
		if (!success) {
			console.log("❌ Error emptying db")
			return
		}
	}

	/* Step 2: Insert batch */
	{
		const errorBatches: Set<string> = new Set()

		// Insert each batch
		for (const file of files) {
			const batchID = uuid()
			const data = await readFile(file, "utf-8")
			const nodes = Object.values(JSON.parse(data)) as DBNode[]

			const success = await Algorithms.insertBatch(batchID, nodes)
			if (success) {
				console.log(`📦 ${batchID} inserted`)
			} else {
				errorBatches.add(batchID)
			}
		}
		if (errorBatches.size > 0)
			console.log("❌ Error batches", errorBatches)
	}

	console.log("✅ Inserted")
}
