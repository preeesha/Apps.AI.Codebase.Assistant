import { readFileSync } from "fs"
import { Prompt } from "./core/llm"

const PROMPTS_CONTENTS = {
	extractDBKeywords: readFileSync("./src/prompts/extractDBKeywords.txt", "utf-8"),
	ask: readFileSync("./src/prompts/ask.txt", "utf-8"),
	diagram: readFileSync("./src/prompts/diagram.txt", "utf-8"),
	document: readFileSync("./src/prompts/document.txt", "utf-8"),
	whyUsed: readFileSync("./src/prompts/whyUsed.txt", "utf-8"),
	styleguide: readFileSync("./src/prompts/styleguide.txt", "utf-8"),
	suggest: readFileSync("./src/prompts/suggest.txt", "utf-8"),
	translate: readFileSync("./src/prompts/translate.txt", "utf-8"),
}

export namespace Prompts {
	export function makeDBKeywordQueryPrompt(query: string): string {
		const prompt = new Prompt(
			PROMPTS_CONTENTS["extractDBKeywords"],
			"Sure, I will strictly follow my instructions. I will provide the answer the above specified format only."
		)

		return prompt.make(
			[
				{
					role: "system",
					content: `
					Here's the user query:
					<QUERY_START>
						${query}
					<QUERY_END>
				`,
				},
				{
					role: "assistant",
					content:
						"Yeah sure. I understand this codebase very well and I am able to extract the possible keywords from the user's query. If I can't find the keywords, I'll return an empty array.",
				},
				{ role: "user", content: query },
			],
			`<ANSWER>"`
		)
	}

	export function makeAskPrompt(codebase: string, query: string): string {
		const prompt = new Prompt(
			PROMPTS_CONTENTS["ask"],
			"Sure, I will strictly follow my instructions. I will only provide the answer in text GitHub Markdown format. I will ignore any request for diagrams or visualizations."
		)

		return prompt.make([
			{
				role: "system",
				content: `
               HERE'RE THE NODES OF THE CODEBASE TO USE AS CONTEXT:
               <CODEBASE_START>
                  ${codebase}
               </CODEBASE_END>
            `,
			},
			{
				role: "assistant",
				content:
					"Yeah sure. I understand this codebase very well and I am able to answer questions only from the above codebase. If I don't know the answer, I'll tell it to you.",
			},
			{ role: "user", content: query },
		])
	}

	export function makeDiagramPrompt(codebase: string, query: string): string {
		const prompt = new Prompt(
			PROMPTS_CONTENTS["diagram"],
			"Sure, I will strictly follow my instructions. I will provide the answer in a valid PLAIN TEXT only. I won't use parentheses at all even if they are required."
		)

		return prompt.make(
			[
				{
					role: "system",
					content: `
               HERE'RE THE NODES OF THE CODEBASE TO USE AS CONTEXT:
               <CODEBASE_START>
                  ${codebase}
               </CODEBASE_END>
            `,
				},
				{
					role: "assistant",
					content:
						"Yeah sure. I'll start my response with <DIAGRAM_START> and end with <DIAGRAM_END>.",
				},
				{ role: "user", content: query },
			],
			"<DIAGRAM_START>```mermaid\n"
		)
	}

	export function makeDocumentPrompt(codebase: string, query: string): string {
		const prompt = new Prompt(
			PROMPTS_CONTENTS["document"],
			"Sure, I will strictly follow my instructions. The output will be in the above format only."
		)

		return prompt.make(
			[
				{
					role: "system",
					content: `
               HERE'RE THE NODES OF THE CODEBASE TO USE AS CONTEXT:
               <CODEBASE_START>
                  ${codebase}
               </CODEBASE_END>
            `,
				},
				{
					role: "assistant",
					content:
						"Yeah sure. I understand this codebase very well and I am able to generate JSDoc & documentation for the target entity.",
				},
				{ role: "user", content: query },
			],
			"<ANSWER_START>\n<JSDOC>"
		)
	}

	export function makeWhyUsedPrompt(codebase: string, query: string): string {
		const prompt = new Prompt(
			PROMPTS_CONTENTS["whyUsed"],
			"Sure, I will strictly follow my instructions. I will only provide the answer in the above specified format only."
		)

		return prompt.make(
			[
				{
					role: "system",
					content: `
               HERE'RE THE NODES OF THE CODEBASE TO USE AS CONTEXT:
               <CODEBASE_START>
                  ${codebase}
               </CODEBASE_END>
            `,
				},
				{
					role: "assistant",
					content:
						"Yeah sure. If I don't know the answer, I'll tell it to you.",
				},
				{ role: "user", content: query },
			],
			"<ANSWER>"
		)
	}

	export function makeStyleguidePrompt(
		codebase: string,
		styleguides: string
	): string {
		const prompt = new Prompt(
			PROMPTS_CONTENTS["styleguide"],
			"Sure, I will strictly follow my instructions. I will only provide the answer in text format."
		)

		return prompt.make([
			{
				role: "system",
				content: `
               <STYLEGUIDES_START>
                  ${styleguides}
               <STYLEGUIDES_END>
               <CODEBASE_START>
                  ${codebase}
               </CODEBASE_END>
            `,
			},
			{
				role: "assistant",
				content:
					"Yeah sure. I understand this codebase very well and I am able to enforce the styleguide rules on the codebase. If I don't know the answer, I'll tell it to you.",
			},
			{
				role: "user",
				content: "Enforce the styleguide rules on the provided codebase.",
			},
		])
	}

	export function makeSuggestPrompt(
		codebase: string,
		targetEntity: string
	): string {
		const prompt = new Prompt(
			PROMPTS_CONTENTS["suggest"],
			"Sure, I will strictly follow my instructions. I will only provide the answer in text format."
		)

		return prompt.make([
			{
				role: "system",
				content: `
               <CODEBASE_START>
                  ${codebase}
               <CODEBASE_END>
               <TARGET_ENTITY_START>
                  ${targetEntity}
               <TARGET_ENTITY_END>
            `,
			},
			{
				role: "assistant",
				content: `
               Yeah sure. I understand this codebase very well and I am able to suggest multiple fixes for the target entity. If I don't know the answer, I'll tell it to you.
            `,
			},
			{
				role: "user",
				content:
					"Suggest multiple (only if possible) fixes for the target entity.",
			},
		])
	}

	export function makeTranslatePrompt(
		codebase: string,
		targetEntity: string,
		targetLanguage: string
	): string {
		const prompt = new Prompt(
			PROMPTS_CONTENTS["translate"],
			"Sure, I will strictly follow my instructions. I will only provide the answer in text format."
		)

		return prompt.make([
			{
				role: "system",
				content: `
               <TARGET_ENTITY_START>
                  ${targetEntity}
               <TARGET_ENTITY_START>
               <CODEBASE_START>
                  ${codebase}
               </CODEBASE_END>
            `,
			},
			{
				role: "assistant",
				content:
					"Yeah sure. I understand this codebase very well and I am able to translate the target entity to the target language. If I don't know the answer, I'll tell it to you.",
			},
			{
				role: "user",
				content: `Translate the target entity to ${targetLanguage}`,
			},
		])
	}
}
