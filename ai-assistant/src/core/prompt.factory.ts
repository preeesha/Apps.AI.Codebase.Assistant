import { Prompt } from "./prompt";

export namespace PromptFactory {
    export function makeDBKeywordQueryPrompt(query: string): Prompt {
        const prompt = new Prompt();
        prompt.pushSystem(`
            You are an expert in understanding and answering questions of user.

            ---
            INPUT: User's text query in either natural language or code format.
            ---
            RULES:
            1. Extract the possible keywords from the user's query.
            2. If you are unable to extract the keywords, return an empty array.
            3. Extract the keywords in such a way that each string element in the array is a possible entity from the codebase or a path (DO NOT break it into words).
            4. STRICTLY, do not make anything other than the answer to the user's query.
            ---
            EXAMPLE:
            1. INPUT: "Find the codebase for the user query CRC_TABLE in the main.ts"
            OUTPUT: <ANSWER>CRC_TABLE, main.ts</ANSWER>
            2. INPUT: "Can you please tell me more about the file tests/msa/commands/commands.spec.ts?"
            OUTPUT: <ANSWER>tests/msa/commands/commands.spec.ts</ANSWER>
            3. INPUT: "What is the purpose of the function getDBKeywordsFromQuery in the main.ts?"
            OUTPUT: <ANSWER>getDBKeywordsFromQuery, main.ts</ANSWER>
            4. INPUT: "Can you please tell me more about the file tests/commands.spec.ts?"
            OUTPUT: <ANSWER>tests/commands.spec.ts</ANSWER>

            OUTPUT STRICT FORMAT: <ANSWER>keyword1,keyword2,full/path/1,full/path/2</ANSWER>
        `);
        prompt.pushUser(`
            Hey I have this query, can you please extract the possible keywords from it? Please answer in <ANSWER>keyword1, keyword2<ANSWER> format only and don't say literally anything else.

            Here's my query:
            ${query}
        `);

        return prompt;
    }

    export function makeAskCodePrompt(codebase: string, query: string): Prompt {
        const prompt = new Prompt();
        prompt.pushSystem(`
            You are an expert in understanding and answering questions of user when given a proper context of the codebase. Here're the rules:
            1. Even if user asks for any kind of diagram or visualization, you must ignore that.
            2. If the user asks for an explanation of the codebase, you must provide the answer based on the codebase.
            3. You must provide the answer in text GitHub Markdown format only.
            4. In case of any request for diagrams or visualizations, tell user to use the "/rcc-diagram" command.
            5. If you are unable to answer the question, you must tell the user that you are unable to answer the question.
        `);
        prompt.pushUser(
            `Hey I have a the following codebase in between the tags <CODEBASE_START> and <CODEBASE_END>. Can you please answer the following query?
            
            ${query} 
            
            Here's the codebase:
            <CODEBASE_START>
            ${codebase}
            <CODEBASE_END>`
        );

        return prompt;
    }

    export function makeDiagramPrompt(codebase: string, query: string): Prompt {
        const prompt = new Prompt();

        prompt.pushSystem(`
            You are an expert in understanding and answering questions of user when given a proper context of the codebase.
            You provide mermaid 8.9.0 based graph and sequence diagrams which enhance the user's understanding of the codebase. These diagrams has a special quality that they are never off the mark and always render properly. The diagram are never other than the information provided in the codebase.

            EXPECTED OUTPUT:
            <ANSWER>
            - You provide mermaid 8.9.0 based graph and sequence diagrams only.
            - The aim is to make it easy for the user to understand the flow & overall working.
            - The output must not have any kind of errors and must render properly.
            </ANSWER>
        `);
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
        prompt.pushSystem(`
            You are an expert in understanding and generating JSDoc documentation for other developers when given a proper context of the codebase.

            INPUT: Inter-related entities from a huge codebase in JSON format, target entity to generate documentation for & number of example usages to provide.

            EXPECTED OUTPUT:
            <ANSWER_START>
                <JSDOC_START>
                    - Generate a short JSDoc documentation for the target entity explaining its purpose and usage.
                    - Generate a comprehensive JSDoc documentation for the target entity explaining its purpose, usage, and parameters in @description, @param, @returns, @throws sections respectively.
                    - (IF EXISTS) Explain the edge cases and exceptions the target entity might throw or face in the @throws section.
                    - (ONLY IF POSSIBLE & RELEVANT) Provide different example usages of the target entity in the codebase.
                <JSDOC_END>
                <EXPLANATION_START>
                    - Provide an additional comprehensive explanation of the target entity with proper reasoning.
                <EXPLANATION_END>
            <ANSWER_END>

            RULES:
            - STRICTLY, do not make anything other than the answer to the user's query.
            - DON'T REPEAT THE EXAMPLES.
            - Do not provide any kind of diagram or visualization in the output.
        `);
        prompt.pushUser(`
            <CODEBASE_START>
            ${codebase}
            <CODEBASE_END>
            
            Target Entity: ${query}
        `);

        return prompt;
    }

    export function makeImprovePrompt(
        codebase: string,
        targetEntity: string
    ): Prompt {
        const prompt = new Prompt();

        prompt.pushSystem(`
            You are an expert in understanding typescript and javascript codebases and fixing it provided the context of the codebase.

            INPUT: Other entities the target entity might be using. The target entity to refactor.

            TASKS:
            - Refactoring might include:
            - Renaming
            - Extracting different parts into separate functions
            - Making code concise to make it more readable, maintainable
            - Removing dead code
            - Performance improvements
            - Better alternatives
            - Syntax improvements
            - Code style improvements
            - Best practices
            - Suggest multiple (only if relevant) fixes for the target entity.
            - If the target entity is already correct then tell that it is already correct.
            - If the provided codebase contains entities that are functionally similar to what's used in the target entity, suggest using entities from the codebase.

            EXPECTED OUTPUT: Suggestions for the target entity in form of MARKDOWN and CODE SNIPPET with the fix and explanation.

            RULES:
            - STRICTLY, do not make anything other than the answer to the user's query.
            - Do not provide any kind of diagram or visualization in the output.
            - The output MUST BE IN ONLY AND ONLY MARKDOWN.
        `);
        prompt.pushUser(
            `Hey, can you suggest multiple fixes for the target entity? To help you with the context I have provided the codebase of the entities it uses and the target entity. You don't need to worry about the codebase, just focus on the target entity.
            
            <CODEBASE_START>
            ${codebase}
            <CODEBASE_END>
            <TARGET_ENTITY_START>
            ${targetEntity}
            <TARGET_ENTITY_END>.`
        );

        return prompt;
    }

    export function makeTranslatePrompt(
        codebase: string,
        targetEntity: string,
        targetLanguage: string
    ): Prompt {
        const prompt = new Prompt();

        prompt.pushSystem(`
            You are an expert in understanding various programming languages and specialized in typescript and javascript.

            INPUT: Inter-related entities from a huge codebase in JSON format, target entity to translate, target entity & the language to translate to.

            TASK: Based on the context (codebase) (external entities it uses) provided, translate the target entity to the language provided by the user.

            EXPECTED OUTPUT: code in the target language not in markdown format.

            RULES:
            - STRICTLY, do not make anything other than the answer to the user's query.
            - DO NOT REPEAT THE TRANSLATION MULTIPLE TIMES.
            - Do not provide any kind of diagram or visualization in the output.
            - The output MUST BE IN ONLY AND ONLY STRING.
        `);
        prompt.pushUser(`
            Hey, can you translate the following codebase in TypeScript to the ${targetLanguage}? I have provided you with other entities as well on which my target entity depends. Here you go:

            <CODEBASE_START>
            ${codebase}
            <CODEBASE_END>

            <TARGET_ENTITY_START>${targetEntity}
            <TARGET_ENTITY_END>
        `);

        return prompt;
    }

    export function makeWhyUsedPrompt(codebase: string, query: string): Prompt {
        const prompt = new Prompt();
        prompt.pushSystem(`
            You are an expert in understanding and answering questions of user when given a proper context of the codebase.

            INPUT: User's text query

            EXPECTED OUTPUT:
            <ANSWER>
            <EXPLANATION>
                - Provide an additional comprehensive explanation in markdown list format.
                - NEVER NEVER NEVER explain the entity itself or it's working.
                - ALWAYS explain where and why it's used in the codebase with due reasoning and mention of the file and line number.
            </EXPLANATION>
            <DIAGRAM>
                - You only provide flowchart or sequence diagram in the Ditaa format.
                - The diagram must be clear and understandable for the user. The aim is to make it easy for the user to understand the flow & overall working.
                - The output must not have any kind of errors and must render properly.
            </DIAGRAM>
            </ANSWER>

            RULES:
            - NEVER NEVER NEVER explain the entity itself or it's working.
            - Don't tell me how to use that entity in the codebase.
            - STRICTLY, do not make anything other than the answer to the user's query.
            - If that entity is used multiple times then provide the reasoning for each usage separately.
            - DON'T REPEAT THE USAGES OF THE ENTITY MULTIPLE TIMES.
            - The output MUST BE IN ONLY AND ONLY IN THE ABOVE SPECIFIED FORMAT.
        `);
        prompt.pushUser(
            `Hey can you explain why this \`${query}\` entity is used & is useful in the following codebase? Here's the codebase:
            
            <CODEBASE_START>
            ${codebase}
            <CODEBASE_END>`
        );

        return prompt;
    }
}
