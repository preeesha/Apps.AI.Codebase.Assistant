import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    ApiEndpoint,
    IApiEndpointInfo,
    IApiRequest,
    IApiResponse,
} from "@rocket.chat/apps-engine/definition/api";
import { DBNode } from "../core/db/db";
import { IDB } from "../core/db/db.types";
import { Neo4j } from "../core/db/neo4j";
import { MiniLML6 } from "../core/embeddings/minilml6";
import {
    IngestEndpointRequestBody,
    IngestEndpointResponseBody,
} from "./ingest.types";

namespace Helpers {
    async function insertNode(db: IDB, node: DBNode) {
        const query = new DBNode(node).getDBInsertQuery();
        try {
            await db.run(query);
        } catch (e) {
            console.log(e);
            console.error("Failed to insert node");
        }
    }

    export async function insertNodes(db: IDB, nodes: DBNode[]) {
        await Promise.all(nodes.map((node) => insertNode(db, node)));
    }

    async function establishRelation(
        db: IDB,
        sourceID: string,
        targetID: string,
        relation: string
    ) {
        const query = [
            `MATCH (n { id: $sourceID })`,
            `MATCH (m { id: $targetID })`,
            `CREATE (n)-[:${relation}]->(m)\n`,
        ].join("\n");
        try {
            await db.run(query, { sourceID, targetID });
        } catch (e) {
            console.error(e);
        }
    }

    export async function establishRelations(db: IDB, nodes: DBNode[]) {
        const jobs: Promise<any>[] = [];
        for (const node of nodes) {
            for (const relation of node.relations) {
                const job = establishRelation(
                    db,
                    node.id,
                    relation.target,
                    relation.relation
                );
                jobs.push(job);
            }
        }
        await Promise.all(jobs);
    }
}

export class IngestEndpoint extends ApiEndpoint {
    public path = "ingest";

    makeBodies(
        content: any
    ): [IngestEndpointRequestBody, IngestEndpointResponseBody] {
        const requestBody = JSON.parse(content) as IngestEndpointRequestBody;
        const responseBody: IngestEndpointResponseBody = {
            batchID: requestBody.batchID,
            status: 200,
        };

        return [requestBody, responseBody];
    }

    async commitProgress(
        db: IDB
    ): Promise<IngestEndpointResponseBody["status"]> {
        try {
            try {
                await db.commitTransaction();
            } catch (e) {
                console.error(e);
                await db.rollbackTransaction();

                return 500;
            }
        } catch (e) {
            console.error(e);
            return 500;
        }

        return 200;
    }

    public async post(
        request: IApiRequest,
        endpoint: IApiEndpointInfo,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<IApiResponse> {
        let [{ nodes }, responseBody] = this.makeBodies(request.content);

        // -----------------------------------------------------------------------------------
        const embeddingModel = new MiniLML6(http);
        nodes = nodes.map((node) => new DBNode(node));
        await Promise.all(nodes.map((x) => x.fillEmbeddings(embeddingModel)));
        // -----------------------------------------------------------------------------------

        const db = new Neo4j(http);
        await db.verifyConnectivity();
        // -----------------------------------------------------------------------------------
        await db.beginTransaction();
        // -----------------------------------------------------------------------------------
        await Helpers.insertNodes(db, nodes);
        // -----------------------------------------------------------------------------------
        responseBody.status = await this.commitProgress(db);
        // -----------------------------------------------------------------------------------

        return this.success(JSON.stringify(responseBody));
    }
}
