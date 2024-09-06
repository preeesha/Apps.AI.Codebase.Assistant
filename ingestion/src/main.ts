import { exec } from "child_process"
import { v4 as uuid } from "uuid"

import { Documentation } from "./process/documentation/prepare"

namespace Algorithms {
	export async function execCommand(command: string) {
		await new Promise((resolve, reject) => {
			exec(command, (error, stdout, stderr) => {
				if (error) {
					reject(`Error: ${error.message}`)
					return
				}
				if (stderr) {
					reject(`Stderr: ${stderr}`)
					return
				}
				resolve(stdout)
			})
		})
	}
}

async function main() {
	const sessionID = uuid()

	// await Algorithms.execCommand(`git clone ${REPO_URI} ${sessionID}`)
	// {
	// 	const codebase = new Codebase(sessionID, new FileProcessor(), 1)
	// 	await codebase.process()
	// 	await insertDataIntoDB(codebase.dataDirPath)
	// }
	// await Algorithms.execCommand(`rm -rf ${sessionID}`)

	const docs = new Documentation()
	await docs.prepare()
}

main()
