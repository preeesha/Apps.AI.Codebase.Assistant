import { writeFileSync } from "fs"
import puppeteer from "puppeteer"

import { DOCUMENTATION_URL } from "../../constants"
import { DevDocDBNode } from "../../core/devDocsDBNode"
import { IDocumentation } from "./documentation.types"
import { DocumentationPage } from "./documentationPage"

export class Documentation implements IDocumentation {
	private async gatherDocumentationLinks() {
		const browser = await puppeteer.launch({
			headless: true, // Ensure it is headless for CI environments
			args: ["--no-sandbox", "--disable-setuid-sandbox"], // Required for CI environments like GitHub Actions
		})

		const page = await browser.newPage()
		await page.goto(DOCUMENTATION_URL)

		try {
			const links = await page.$$eval(".leftsidebarnav a", (links) =>
				links.map((x) => x.href).filter(Boolean)
			)
			return links
		} finally {
			await browser.close()
		}
	}

	private async prepareDevDocsNodes(): Promise<DevDocDBNode[]> {
		const urls = await this.gatherDocumentationLinks()

		const docPages = urls.map((x) => new DocumentationPage(x))

		const failed: string[] = []
		const nodes = await Promise.all(
			docPages.map(async (x) => {
				try {
					return await x.fetchNodes()
				} catch {
					failed.push(x.url)
					return []
				}
			})
		)

		if (failed.length > 0) {
			console.clear()
			console.warn(
				`Failed to fetch nodes for the following URLs: ${failed.join(", ")}`
			)
		}

		const flattenedNodes = nodes.flat()
		return flattenedNodes
	}

	async prepare() {
		const nodes = await this.prepareDevDocsNodes()
		writeFileSync("nodes.json", JSON.stringify(nodes, null, 3))
	}
}
