import {
    IHttp,
    IHttpResponse,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IDB } from "./db.types";

export class Neo4j implements IDB {
    private http: IHttp;
    private readonly baseUrl: string;
    private readonly username: string;
    private readonly password: string;
    private transactionUrl?: string;

    constructor(
        http: IHttp,
        baseUrl: string,
        username: string,
        password: string
    ) {
        this.http = http;
        this.baseUrl = baseUrl;
        this.username = username;
        this.password = password;
    }

    private async sendRequest(
        endpoint: string,
        method: string,
        data?: any
    ): Promise<IHttpResponse> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from(
                `${this.username}:${this.password}`
            ).toString("base64")}`,
        };
        return this.http.post(url, {
            headers,
            data: data ? JSON.stringify(data) : undefined,
        });
    }

    async verifyConnectivity(): Promise<void> {
        const response = await this.sendRequest("/db/neo4j/tx/commit", "POST", {
            statements: [],
        });
        if (response.statusCode !== 200) {
            throw new Error("Failed to connect to Neo4j");
        }
    }

    async closeDBConnection(): Promise<void> {
        // No explicit close connection needed for HTTP connections
        return Promise.resolve();
    }

    async beginTransaction(): Promise<void> {
        if (this.transactionUrl) {
            throw new Error("Transaction already exists");
        }

        const response = await this.sendRequest("/db/neo4j/tx", "POST", {
            statements: [],
        });
        if (response.statusCode !== 201) {
            throw new Error(`Failed to begin transaction: ${response.content}`);
        }
        this.transactionUrl = response.headers?.["location"];
    }

    async commitTransaction(): Promise<void> {
        if (!this.transactionUrl) {
            throw new Error("No transaction to commit");
        }

        if (!this.transactionUrl) {
            throw new Error("No transaction to commit");
        }
        const response = await this.sendRequest(
            `${this.transactionUrl}/commit`,
            "POST"
        );
        if (response.statusCode !== 200) {
            throw new Error(
                `Failed to commit transaction: ${response.content}`
            );
        }
        this.transactionUrl = undefined;
    }

    async rollbackTransaction(): Promise<void> {
        if (!this.transactionUrl) {
            throw new Error("No transaction to rollback");
        }

        if (!this.transactionUrl) {
            throw new Error("No transaction to rollback");
        }
        const response = await this.sendRequest(this.transactionUrl, "DELETE");
        if (response.statusCode !== 200) {
            throw new Error(
                `Failed to rollback transaction: ${response.content}`
            );
        }
        this.transactionUrl = undefined;
    }

    async run(query: string, params?: any): Promise<any> {
        const data = {
            statements: [
                {
                    statement: query,
                    parameters: params || {},
                },
            ],
        };

        let response;
        if (this.transactionUrl) {
            response = await this.sendRequest(
                this.transactionUrl,
                "POST",
                data
            );
        } else {
            response = await this.sendRequest(
                "/db/neo4j/tx/commit",
                "POST",
                data
            );
        }

        if (response.statusCode !== 200) {
            throw new Error(`Failed to run query: ${response.content}`);
        }

        return response.data;
    }
}
