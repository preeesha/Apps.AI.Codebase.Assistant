import { PROMPT_ASK_COMMAND } from "./contents/ask";
import { PROMPT_DIAGRAM_COMMAND } from "./contents/diagram";
import { PROMPT_DOCUMENT_COMMAND } from "./contents/document";
import { PROMPT_EXTRACT_DB_KEYWORDS } from "./contents/extractDBKeywords";
import { PROMPT_STYLEGUIDE_COMMAND } from "./contents/styleguide";
import { PROMPT_SUGGEST_COMMAND } from "./contents/suggest";
import { PROMPT_TRANSLATE_COMMAND } from "./contents/translate";
import { PROMPT_WHY_USED_COMMAND } from "./contents/whyUsed";
import { Prompt } from "./prompt";

export namespace PromptFactory {
    export function makeDBKeywordQueryPrompt(query: string): Prompt {
        const prompt = new Prompt();
        prompt.pushSystem(PROMPT_EXTRACT_DB_KEYWORDS);
        prompt.pushUser(
            `Hey I have this query, can you please extract the possible keywords from it? Please answer in the format only and don't say literally anything else <ANSWER_START>keyword1, keyword2<ANSWER_END>.\n\nHere's my query:\n${query}`
        );

        return prompt;
    }

    export function makeAskPrompt(codebase: string, query: string): Prompt {
        const prompt = new Prompt();
        prompt.pushSystem(PROMPT_ASK_COMMAND);
        prompt.pushUser(
            `Hey I have a the following codebase in between the tags <CODEBASE_START> and <CODEBASE_END>. Can you please answer the following query?\n\n${query} \n\nHere's the codebase:\n<CODEBASE_START>\n${codebase}\n<CODEBASE_END>`
        );

        return prompt;
    }

    export function makeDiagramPrompt(codebase: string, query: string): Prompt {
        const prompt = new Prompt();

        prompt.pushSystem(PROMPT_DIAGRAM_COMMAND);
        prompt.pushAssistant(
            "Sure, I will strictly follow my instructions. I will provide the answer in a valid PLAIN TEXT only. I won't use parentheses at all even if they are required."
        );
        prompt.pushSystem(`
            HERE'RE THE NODES OF THE CODEBASE TO USE AS CONTEXT:
            <CODEBASE_START>
                ${codebase}
            </CODEBASE_END>
        `);
        prompt.pushAssistant(
            "Yeah sure. I'll start my response with <DIAGRAM_START> and end with <DIAGRAM_END>."
        );
        prompt.pushUser(query);
        prompt.pushSystem("<DIAGRAM_START>```mermaid\n");

        return prompt;
    }

    export function makeDocumentPrompt(
        codebase: string,
        query: string
    ): Prompt {
        const prompt = new Prompt();
        prompt.pushSystem(PROMPT_DOCUMENT_COMMAND);
        prompt.pushUser(
            `<CODEBASE_START>\n${codebase}\n<CODEBASE_END>\n\nTarget Entity: ${query}`
        );

        return prompt;
    }

    export function makeWhyUsedPrompt(codebase: string, query: string): Prompt {
        const prompt = new Prompt();
        prompt.pushSystem(PROMPT_WHY_USED_COMMAND);
        prompt.pushUser(
            `Hey can you explain why this \`${query}\` entity is used in the following codebase? Here's the codebase:\n\n<CODEBASE_START>\n${codebase}\n<CODEBASE_END>`
        );

        return prompt;
    }

    export function makeStyleguidePrompt(
        codebase: string,
        styleguides: string
    ): Prompt {
        const prompt = new Prompt();

        prompt.pushSystem(PROMPT_STYLEGUIDE_COMMAND);
        prompt.pushAssistant(
            "Sure, I will strictly follow my instructions. I will only provide the answer in text format."
        );
        prompt.pushSystem(`
            <STYLEGUIDES_START>
                ${styleguides}
            <STYLEGUIDES_END>
        `);
        prompt.pushSystem(`
            <CODEBASE_START>
                ${codebase}
            <CODEBASE_END>
        `);
        prompt.pushAssistant(
            "Yeah sure. I understand this codebase very well and I am able to enforce the styleguide rules on the codebase. If I don't know the answer, I'll tell it to you."
        );
        prompt.pushUser(
            "Enforce the styleguide rules on the provided codebase."
        );
        prompt.pushSystem("<ANSWER>");

        return prompt;
    }

    export function makeSuggestPrompt(
        codebase: string,
        targetEntity: string
    ): Prompt {
        const prompt = new Prompt();

        prompt.pushSystem(PROMPT_SUGGEST_COMMAND);
        prompt.pushUser(
            `Hey, can you suggest multiple fixes for the target entity? To help you with the context I have provided the codebase of the entities it uses and the target entity. You don't need to worry about the codebase, just focus on the target entity.\n\n<CODEBASE_START>\n${codebase}\n<CODEBASE_END>\n<TARGET_ENTITY_START>${targetEntity}\n<TARGET_ENTITY_END>.`
        );

        return prompt;
    }

    export function makeTranslatePrompt(
        codebase: string,
        targetEntity: string,
        targetLanguage: string
    ): Prompt {
        const prompt = new Prompt();

        prompt.pushSystem(PROMPT_TRANSLATE_COMMAND);
        prompt.pushUser(
            `Hey, can you translate the following codebase in TypeScript to the ${targetLanguage}? I have provided you with other entities as well on which my target entity depends. Here you go:\n\n<CODEBASE_START>\n${codebase}\n<CODEBASE_END>\n<TARGET_ENTITY_START>${targetEntity}\n<TARGET_ENTITY_END>`
        );

        return prompt;
    }
}
