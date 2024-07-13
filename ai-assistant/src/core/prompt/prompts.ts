import { PROMPT_ASK_COMMAND } from "./contents/ask";
import { PROMPT_DIAGRAM_COMMAND } from "./contents/diagram";
import { PROMPT_DOCUMENT_COMMAND } from "./contents/document";
import { PROMPT_EXTRACT_DB_KEYWORDS } from "./contents/extractDBKeywords";
import { PROMPT_STYLEGUIDE_COMMAND } from "./contents/styleguide";
import { PROMPT_SUGGEST_COMMAND } from "./contents/suggest";
import { PROMPT_TRANSLATE_COMMAND } from "./contents/translate";
import { PROMPT_WHY_USED_COMMAND } from "./contents/whyUsed";
import { Prompt } from "./prompt";

export namespace Prompts {
    export function makeDBKeywordQueryPrompt(query: string): string {
        const prompt = new Prompt(
            PROMPT_EXTRACT_DB_KEYWORDS,
            "Sure, I will strictly follow my instructions. I will provide the answer the above specified format only."
        );

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
        );
    }

    export function makeAskPrompt(codebase: string, query: string): string {
        const prompt = new Prompt(
            PROMPT_ASK_COMMAND,
            "Sure, I will strictly follow my instructions. I will only provide the answer in text GitHub Markdown format. I will ignore any request for diagrams or visualizations."
        );

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
        ]);
    }

    export function makeDiagramPrompt(codebase: string, query: string): string {
        const prompt = new Prompt(
            PROMPT_DIAGRAM_COMMAND,
            "Sure, I will strictly follow my instructions. I will provide the answer in a valid PLAIN TEXT only. I won't use parentheses at all even if they are required."
        );

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
        );
    }

    export function makeDocumentPrompt(
        codebase: string,
        query: string
    ): string {
        const prompt = new Prompt(
            PROMPT_DOCUMENT_COMMAND,
            "Sure, I will strictly follow my instructions. The output will be in the above format only."
        );

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
        );
    }

    export function makeWhyUsedPrompt(codebase: string, query: string): string {
        const prompt = new Prompt(
            PROMPT_WHY_USED_COMMAND,
            "Sure, I will strictly follow my instructions. I will only provide the answer in the above specified format only."
        );

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
        );
    }

    export function makeStyleguidePrompt(
        codebase: string,
        styleguides: string
    ): string {
        const prompt = new Prompt(
            PROMPT_STYLEGUIDE_COMMAND,
            "Sure, I will strictly follow my instructions. I will only provide the answer in text format."
        );

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
                content:
                    "Enforce the styleguide rules on the provided codebase.",
            },
        ]);
    }

    export function makeSuggestPrompt(
        codebase: string,
        targetEntity: string
    ): string {
        const prompt = new Prompt(
            PROMPT_SUGGEST_COMMAND,
            "Sure, I will strictly follow my instructions. I will only provide the answer in text format."
        );

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
        ]);
    }

    export function makeTranslatePrompt(
        codebase: string,
        targetEntity: string,
        targetLanguage: string
    ): string {
        const prompt = new Prompt(
            PROMPT_TRANSLATE_COMMAND,
            "Sure, I will strictly follow my instructions. I will only provide the answer in text format."
        );

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
        ]);
    }
}
