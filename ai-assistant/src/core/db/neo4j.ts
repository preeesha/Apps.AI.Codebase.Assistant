import { IHttp } from "@rocket.chat/apps-engine/definition/accessors";
import { IDB } from "./db.types";

export class Neo4j implements IDB {
    private http: IHttp;

    constructor(http: IHttp) {
        this.http = http;
    }

    async verifyConnectivity() {
        throw new Error("Not implemented");
    }

    async closeDBConnection() {
        throw new Error("Not implemented");
    }

    async beginTransaction() {
        throw new Error("Not implemented");
    }

    async commitTransaction() {
        throw new Error("Not implemented");
    }

    async rollbackTransaction() {
        throw new Error("Not implemented");
    }

    async run(query: string, params?: any) {
        throw new Error("Not implemented");
    }
}
