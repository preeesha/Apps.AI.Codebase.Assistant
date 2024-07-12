import { IDB } from "./db.types";

export class Neo4j implements IDB {
    async verifyConnectivity() {
        throw new Error("Not implemented");
    }

    async closeDBConnection() {
        throw new Error("Not implemented");
    }
}
