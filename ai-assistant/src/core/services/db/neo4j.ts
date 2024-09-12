import { IHttp } from "@rocket.chat/apps-engine/definition/accessors"
import { IDB } from "./db.types"

export type Neo4jResponse = {
   transactionUrl?: string
   results: {
      columns: string[]
      data: {
         row: Record<string, any>[]
         meta: {
            id: number
            elementId: string
            type: string
            deleted: boolean
         }[]
      }[]
   }[]
   errors: any[]
   lastBookmarks: string[]
}

export class Neo4j implements IDB {
   private http: IHttp
   private readonly baseUrl: string
   private readonly username: string
   private readonly password: string
   private transactionUrl?: string

   constructor(
      http: IHttp
      // baseUrl: string,
      // username: string,
      // password: string
   ) {
      this.http = http

      this.baseUrl = "http://neo4j:7474"
      this.username = "neo4j"
      this.password = "strongpasswordsafe123"

      // this.baseUrl = "http://44.192.104.170:7474"
      // this.username = "neo4j"
      // this.password = "individuals-societies-wools"
   }

   /**
    * Sends a request to the specified endpoint using the specified method and data.
    * @param {string} endpoint - The endpoint to send the request to.
    * @param {string} method - The HTTP method to use for the request.
    * @param {any} [data] - The data to send with the request.
    * @returns {Promise<Neo4jResponse | null>} A promise that resolves to the response from the server, or null if an error occurred.
    */
   private async sendRequest(endpoint: string, method: string, data?: any): Promise<Neo4jResponse | null> {
      const url = `${this.baseUrl}${endpoint}`
      const headers = {
         "Content-Type": "application/json",
         Authorization: `Basic ${Buffer.from(`${this.username}:${this.password}`).toString("base64")}`,
      }

      const res = await this.http.post(url, {
         headers,
         data: data,
      })

      if (!res || ![200, 201].includes(res.statusCode) || !res.content) {
         return null
      }
      const parsedContent = JSON.parse(res.content)
      if (parsedContent.errors.length) return null

      return parsedContent
   }

   /**
    * Verifies the connectivity to the Neo4j database.
    *
    * @returns A Promise that resolves to void.
    * @throws An Error if the connection to Neo4j fails.
    */
   async verifyConnectivity(): Promise<void> {
      const response = await this.sendRequest("/db/neo4j/tx/commit", "POST", {
         statements: [],
      })
      if (!response) {
         throw new Error("Failed to connect to Neo4j")
      }
   }

   /**
    * Closes the connection to the Neo4j database.
    *
    * @returns A promise that resolves when the connection is closed.
    */
   async closeDBConnection(): Promise<void> {
      // No explicit close connection needed for HTTP connections
      return Promise.resolve()
   }

   /**
    * Begins a new transaction in the Neo4j database.
    *
    * @throws {Error} If a transaction already exists.
    * @throws {Error} If the transaction fails to begin.
    *
    * @returns {Promise<void>} A promise that resolves when the transaction is successfully started.
    */
   async beginTransaction(): Promise<void> {
      if (this.transactionUrl) {
         throw new Error("Transaction already exists")
      }

      const response = await this.sendRequest("/db/neo4j/tx", "POST", {
         statements: [],
      })
      if (!response) {
         throw new Error(`Failed to begin transaction`)
      }
      this.transactionUrl = response.transactionUrl
   }

   /**
    * Commits the current transaction.
    *
    * @throws {Error} If there is no transaction to commit.
    * @throws {Error} If the transaction commit fails.
    *
    * @returns {Promise<void>} A promise that resolves when the transaction is successfully committed.
    */
   async commitTransaction(): Promise<void> {
      if (!this.transactionUrl) {
         throw new Error("No transaction to commit")
      }
      const response = await this.sendRequest(`${this.transactionUrl}/commit`, "POST")
      if (!response) {
         throw new Error("Failed to commit transaction")
      }
      this.transactionUrl = undefined
   }

   /**
    * Rolls back the current transaction.
    *
    * @throws {Error} If there is no transaction to rollback.
    * @throws {Error} If the transaction rollback fails.
    *
    * @returns {Promise<void>} A promise that resolves when the transaction is successfully rolled back.
    */
   async rollbackTransaction(): Promise<void> {
      if (!this.transactionUrl) {
         throw new Error("No transaction to rollback")
      }
      const response = await this.sendRequest(this.transactionUrl, "DELETE")
      if (!response) {
         throw new Error("Failed to rollback transaction")
      }
      this.transactionUrl = undefined
   }

   /**
    * Executes a Neo4j query and returns the result as an array of records.
    * @param query - The Neo4j query to be executed.
    * @param params - Optional parameters for the query.
    * @returns A promise that resolves to an array of records.
    * @throws An error if the query fails to execute or if there are any errors in the response.
    */
   async run(query: string, params?: any): Promise<Record<string, any>[]> {
      const data = {
         statements: [
            {
               statement: query,
               parameters: params || {},
            },
         ],
      }

      let response: Neo4jResponse | null = null
      if (this.transactionUrl) {
         response = await this.sendRequest(this.transactionUrl, "POST", data)
      } else {
         response = await this.sendRequest("/db/neo4j/tx/commit", "POST", data)
      }

      if (!response) {
         throw new Error("Failed to run query")
      }

      if (response.errors.length) {
         throw new Error(response.errors.map((x) => JSON.stringify(x)).join("\n\n"))
      }

      const nodes: Record<string, any>[] = []
      for (const result of response.results) {
         for (const data of result.data) {
            for (const row of data.row) {
               nodes.push(row)
            }
         }
      }

      return nodes
   }
}
