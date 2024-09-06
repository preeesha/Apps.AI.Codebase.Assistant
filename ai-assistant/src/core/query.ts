import { PromptFactory } from "./prompt.factory";
import { IDB } from "./services/db/db.types";
import { DBNode } from "./services/db/dbNode";
import { IEmbeddingModel } from "./services/embeddings/embeddings.types";
import { ILLMModel } from "./services/llm/llm.types";

/**
 * The Query namespace provides functions for querying a database and retrieving nodes based on various criteria.
 */
export namespace Query {
    /**
     * Retrieves database nodes based on a vector query.
     *
     * @param {IDB} db - The database instance.
     * @param {string} indexName - The name of the index to query.
     * @param {number[]} vector - The vector to query with.
     * @param {number} threshold - The minimum score threshold for the query results.
     * @returns {Promise<DBNode[]>} - A promise that resolves to an array of DBNode objects.
     */
    export async function getDBNodesFromVectorQuery(
        db: IDB,
        indexName: string,
        vector: number[],
        threshold: number
    ): Promise<DBNode[]> {
        const result = await db.run(
            `
				CALL db.index.vector.queryNodes("${indexName}", 2, $vector)
				YIELD node, score 
                WHERE score >= ${threshold}
                WITH node, score
                OPTIONAL MATCH (node)-[r]->(relatedNode)
                RETURN node, COLLECT(relatedNode) AS relatedNodes, score
                ORDER BY score DESC
			`,
            { vector }
        );
        if (!result.length) return [];

        const nodes: DBNode[] = [];
        const processRecord = (record: any) => {
            const data = record as DBNode;
            data.nameEmbeddings = [];
            data.codeEmbeddings = [];
            nodes.push(data);
        };
        // node
        processRecord(result[0]);
        // relatedNodes
        for (const record of (result as any)[1]) processRecord(record);

        return nodes;
    }

    /**
     * Retrieves code nodes from the database based on a list of keywords.
     *
     * @param {IDB} db - The database object.
     * @param {IEmbeddingModel} embeddingModel - The embedding model used for generating query vectors.
     * @param {string[]} keywords - The list of keywords to search for.
     * @returns {Promise<DBNode[]>} - A promise that resolves to an array of DBNode objects matching the keywords.
     */
    export async function getCodeNodesFromKeywords(
        db: IDB,
        embeddingModel: IEmbeddingModel,
        keywords: string[]
    ): Promise<DBNode[]> {
        const results: DBNode[] = [];
        for (const keyword of keywords) {
            const queryVector = await embeddingModel.generate(keyword);
            if (!queryVector) continue;

            const result = await getDBNodesFromVectorQuery(
                db,
                "nameEmbeddings",
                queryVector,
                0.85
            );
            results.push(...result);
        }

        return results;
    }

    /**
     * Retrieves database keywords from a given query using a language model.
     *
     * @param llm - The language model used to generate the keywords.
     * @param query - The query string to extract keywords from.
     * @returns A promise that resolves to an array of database keywords extracted from the query.
     */
    export async function getDBKeywordsFromQuery(
        llm: ILLMModel,
        query: string
    ): Promise<string[]> {
        const content = await llm.ask(
            PromptFactory.makeDBKeywordQueryPrompt(query)
        );
        if (!content) return [];

        // @ts-ignore
        const keywords = content
            .split("<ANSWER>")[1]
            .split("</ANSWER>")[0]
            .split(",")
            .map((x) => x.trim())
            .map((x) => {
                if (x.startsWith('"') && x.endsWith('"')) {
                    return x.slice(1, -1);
                }
                return x;
            });

        return keywords;
    }
}
