import {
    IHttp,
    IModify,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    ISlashCommand,
    SlashCommandContext,
} from "@rocket.chat/apps-engine/definition/slashcommands";
import { Query } from "../core/query";
import { DBNode } from "../core/services/db/db";
import { IDB } from "../core/services/db/db.types";
import { Neo4j } from "../core/services/db/neo4j";
import { MiniLML6 } from "../core/services/embeddings/minilml6";
import { handleCommandResponse } from "../utils/handleCommandResponse";

export class ImportanceCommand implements ISlashCommand {
    public command = "rcc-importance";
    public i18nParamsExample = "";
    public i18nDescription = "";
    public providesPreview = false;

    /**
     * Calculates the centrality of a given node in the database.
     * Centrality is a measure of the importance or influence of a node in a graph.
     *
     * @param {IDB} db - The database instance.
     * @param {DBNode} node - The node for which centrality needs to be calculated.
     * @returns {Promise<number>} The centrality value of the node.
     */
    async calculateCentrality(db: IDB, node: DBNode): Promise<number> {
        const maxOutDegreeQuery = await db.run(
            `
				MATCH (n)
				WITH n, [(n)-[]->() | 1] AS outgoingRelationships
				RETURN size(outgoingRelationships) AS outDegree
				ORDER BY outDegree DESC
				LIMIT 1
			`
        );
        if (!maxOutDegreeQuery.length) return 0;
        const maxOutDegree = maxOutDegreeQuery[0] as unknown as number;

        const outDegree = await db.run(
            `
				MATCH (n:Node { id: $id })<-[]-(x) 
				RETURN count(x) AS outDegree
                `,
            { id: node.id }
        );
        if (!outDegree.length) return 0;
        const centrality = outDegree[0] as unknown as number;

        const relativeCentrality = centrality / maxOutDegree;
        return relativeCentrality;
    }

    /**
     * Calculates the criticality of a given node in the database.
     *
     * @param {IDB} db - The database object.
     * @param {DBNode} node - The node for which to calculate the criticality.
     * @returns {Promise<number>} The relative criticality of the node.
     */
    async calculateCriticality(db: IDB, node: DBNode): Promise<number> {
        const maxInDegreeQuery = await db.run(
            `
				MATCH (n)
				WITH n, [(n)<-[]-() | 1] AS incomingRelationships
				RETURN size(incomingRelationships) AS inDegree
				ORDER BY inDegree DESC
				LIMIT 1
			`
        );
        if (!maxInDegreeQuery.length) return 0;
        const maxInDegree = maxInDegreeQuery[0] as unknown as number;

        const inDegree = await db.run(
            `
				MATCH (n:Node { id: $id })-[]->(x) 
				RETURN count(x) AS inDegree
			`,
            { id: node.id }
        );
        if (!inDegree.length) return 0;
        const criticality = inDegree[0] as unknown as number;

        const relativeCriticality = criticality / maxInDegree;
        return relativeCriticality;
    }

    /**
     * Calculates the number of lines of code in a given DBNode.
     *
     * @param {DBNode} node - The DBNode object representing the code.
     * @returns {number} The total number of lines of code.
     */
    calculateLinesOfCode(node: DBNode): number {
        const loc = node.code.split("\n").length;
        return loc;
    }

    /**
     * Processes the given query to calculate the importance of a code node.
     *
     * @param http - The HTTP client used for making requests.
     * @param query - The user's query.
     * @returns A promise that resolves to an object containing the calculated importance metrics: lines of code (loc), centrality, criticality, and overall importance.
     *          Returns null if no code nodes are found.
     */
    private async process(
        http: IHttp,
        query: string
    ): Promise<Record<string, number> | null> {
        const db = new Neo4j(http);
        const embeddingModel = new MiniLML6(http);

        /**
         * ---------------------------------------------------------------------------------------------
         * STEP 1:
         * Extract the possible keywords from the user's query
         * ---------------------------------------------------------------------------------------------
         */
        const keywords = [query];

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
        const targetNode = codeNodes[0];

        /**
         * ---------------------------------------------------------------------------------------------
         * STEP 3:
         * Generate the final score based on various factors
         * ---------------------------------------------------------------------------------------------
         */
        const loc = this.calculateLinesOfCode(targetNode);
        const centrality = await this.calculateCentrality(db, targetNode);
        const criticality = await this.calculateCriticality(db, targetNode);
        const importance = (centrality + criticality) / 2;

        return { loc, centrality, criticality, importance };
    }

    /**
     * Executes the ImportanceCommand.
     *
     * @param {SlashCommandContext} context - The context of the slash command.
     * @param {IRead} read - The read utility.
     * @param {IModify} modify - The modify utility.
     * @param {IHttp} http - The HTTP utility.
     * @returns {Promise<void>} - A promise that resolves when the execution is complete.
     */
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
            await sendEditedMessage("❌ Cannot calculate the importance!");
            return;
        }

        let message = "";
        message += `1. Criticality: ${Math.round(res.criticality * 100)}%\n`;
        message += `2. Centrality: ${Math.round(res.centrality * 100)}%\n`;
        message += `3. Importance: ${Math.round(res.importance * 100)}%\n`;
        message += `4. LOC: ${res.loc}\n`;

        await sendEditedMessage(message);
    }
}
