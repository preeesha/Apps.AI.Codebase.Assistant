import {
    IHttp,
    IModify,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    ISlashCommand,
    SlashCommandContext,
} from "@rocket.chat/apps-engine/definition/slashcommands";
import { Neo4j } from "../core/services/db/neo4j";
// import { renderDiagramToBase64URI } from "../core/diagram";
import { PromptFactory } from "../core/prompt.factory";
import { Query } from "../core/query";
import { MiniLML6 } from "../core/services/embeddings/minilml6";
import { Llama3_70B } from "../core/services/llm/llama3_70B";
import { handleCommandResponse } from "../utils/handleCommandResponse";

export class WhyUsedCommand implements ISlashCommand {
    public command = "rcc-whyused";
    public i18nParamsExample = "";
    public i18nDescription = "";
    public providesPreview = false;

    private async process(
        http: IHttp,
        query: string
    ): Promise<{
        explanation: string;
        diagram: string;
    } | null> {
        const db = new Neo4j(http);
        const llm = new Llama3_70B(http);
        const embeddingModel = new MiniLML6(http);

        /**
         * ---------------------------------------------------------------------------------------------
         * STEP 1:
         * Extract the possible keywords from the user's query
         * ---------------------------------------------------------------------------------------------
         */
        const keywords = await Query.getDBKeywordsFromQuery(llm, query);
        console.log(keywords);
        if (!keywords.length) return null;

        /**
         * ---------------------------------------------------------------------------------------------
         * STEP 2:
         * Query the database to find the nodes names of which are similar to what user has requested
         * ---------------------------------------------------------------------------------------------
         */
        const codeNodes = await Query.getCodeNodesFromKeywords(
            db,
            embeddingModel,
            keywords
        );
        if (!codeNodes.length) return null;

        /**
         * ---------------------------------------------------------------------------------------------
         * STEP 3:
         * Generate the answer and diagram for the user's query given the nodes data
         * ---------------------------------------------------------------------------------------------
         */
        const result = await llm.ask(
            PromptFactory.makeWhyUsedPrompt(
                codeNodes.map((x) => x.code).join("\n\n"),
                query
            )
        );
        if (!result) return null;

        const explanation = result
            .split("<EXPLANATION>")[1]
            .split("</EXPLANATION>")[0]
            .trim();
        const diagram = result
            .split("<DIAGRAM>")[1]
            .split("</DIAGRAM>")[0]
            .trim();

        /**
         * ---------------------------------------------------------------------------------------------
         * STEP 4:
         * Generate the diagram for the user's query given the nodes data
         * ---------------------------------------------------------------------------------------------
         */
        const data = { explanation, diagram: "" };
        // TODO:
        // if (diagram) {
        //     const parsedDiagram = diagram
        //         .replace("```mermaid", "")
        //         .replace("```", "")
        //         .trim();
        //     writeFileSync("output.txt", parsedDiagram);
        //     try {
        //         // data.diagram = await renderDiagramToBase64URI(parsedDiagram);
        //     } catch {}
        // }

        return data;
    }

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp
    ): Promise<void> {
        const [query] = context.getArguments();
        if (!query) return;

        const sendEditedMessage = await handleCommandResponse(
            query,
            context.getSender(),
            context.getRoom(),
            modify,
            this.command
        );

        const res = await this.process(http, query);
        if (!res) {
            await sendEditedMessage("❌ No references found!");
            return;
        }

        await sendEditedMessage(res.explanation, [res.diagram!]);
    }
}
