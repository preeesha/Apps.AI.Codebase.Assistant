import { DBNode } from "./db/db";
import { IDB } from "./db/db.types";
import { IEmbeddingModel } from "./embeddings/embeddings.types";
import { ILLMModel } from "./llm/llm.types";
import { Prompts } from "./prompt/prompts";

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
				MATCH (node)-[r]->(relatedNode)
				RETURN node, COLLECT(relatedNode) AS relatedNodes, score
				ORDER BY score DESC
			`,
            { vector }
        );

        const data = result.records.map((record) => record.toObject());
        const results: any[] = [];
        for (const record of data) {
            const n = record.node.properties;
            delete n["nameEmbeddings"];
            delete n["codeEmbeddings"];
            results.push(n);
        }

        return results;
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
                0.7
            );
            results.push(...result);
        }

        return results;
    }

    export async function getDBKeywordsFromQuery(
        llm: ILLMModel,
        query: string
    ): Promise<string[]> {
        const content = await llm.ask(Prompts.makeDBKeywordQueryPrompt(query));
        if (!content) return [];

        console.log(content);

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
        console.log(keywords);

        return keywords;
    }
}
