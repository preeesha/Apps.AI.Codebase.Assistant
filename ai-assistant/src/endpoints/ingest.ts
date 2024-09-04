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
import { DBNode } from "../core/services/db/db";
import { IDB } from "../core/services/db/db.types";
import { Neo4j } from "../core/services/db/neo4j";
import { MiniLML6 } from "../core/services/embeddings/minilml6";
import {
    IngestEndpointRequestBody,
    IngestEndpointResponseBody,
} from "./ingest.types";

namespace Helpers {
    /**
     * Inserts a node into the database.
     * 
     * @param {IDB} db - The database instance.
     * @param {DBNode} node - The node to be inserted.
     * @returns {Promise<void>} - A promise that resolves when the node is successfully inserted.
     */
    async function insertNode(db: IDB, node: DBNode) {
        const query = new DBNode(node).getDBInsertQuery();
        await db.run(query, node);
    }

    /**
     * Inserts an array of nodes into the database.
     * 
     * @param {IDB} db - The database object.
     * @param {DBNode[]} nodes - The array of nodes to be inserted.
     * @returns {Promise<void>} - A promise that resolves when all nodes have been inserted.
     */
    export async function insertNodes(db: IDB, nodes: DBNode[]) {
        await Promise.all(nodes.map((node) => insertNode(db, node)));
    }
}

export class IngestEndpoint extends ApiEndpoint {
    public path = "ingest";

    /**
     * Generates the request and response bodies for the IngestEndpoint.
     * 
     * @param content - The content to be used for generating the request body.
     * @returns An array containing the generated request body and response body.
     */
    makeBodies(
        content: any
    ): [IngestEndpointRequestBody, IngestEndpointResponseBody] {
        const requestBody = content as IngestEndpointRequestBody;
        const responseBody: IngestEndpointResponseBody = {
            batchID: "hey",
            status: 200,
        };

        return [requestBody, responseBody];
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
        const jobs = nodes.map((node) =>
            db.run(new DBNode(node).getDBInsertQuery(), node)
        );
        await Promise.all(jobs);
        // -----------------------------------------------------------------------------------

        return this.success(JSON.stringify(responseBody));
    }
}
