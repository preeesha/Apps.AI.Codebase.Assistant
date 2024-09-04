import { PromptFactory } from "./prompt.factory";
import { DBNode } from "./services/db/db";
import { IDB } from "./services/db/db.types";
import { IEmbeddingModel } from "./services/embeddings/embeddings.types";
import { ILLMModel } from "./services/llm/llm.types";

export namespace Query {
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
