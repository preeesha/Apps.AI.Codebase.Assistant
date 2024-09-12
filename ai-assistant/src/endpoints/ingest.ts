import { IHttp, IModify, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors"
import {
   ApiEndpoint,
   IApiEndpointInfo,
   IApiRequest,
   IApiResponse,
} from "@rocket.chat/apps-engine/definition/api"
import { DBNode } from "../core/services/db/dbNode"
import { DevDocDBNode } from "../core/services/db/devDocDBNode"
import { Neo4j } from "../core/services/db/neo4j"
import { MiniLML6 } from "../core/services/embeddings/minilml6"
import { IngestEndpointRequestBody, IngestEndpointResponseBody } from "./ingest.types"

export class IngestEndpoint extends ApiEndpoint {
   public path = "ingest"

   /**
    * Generates the request and response bodies for the IngestEndpoint.
    *
    * @param content - The content to be used for generating the request body.
    * @returns An array containing the generated request body and response body.
    */
   makeBodies(content: any): [IngestEndpointRequestBody, IngestEndpointResponseBody] {
      const requestBody = content as IngestEndpointRequestBody
      const responseBody: IngestEndpointResponseBody = {
         batchID: requestBody.batchID,
         status: 200,
      }

      return [requestBody, responseBody]
   }

   public async post(
      request: IApiRequest,
      endpoint: IApiEndpointInfo,
      read: IRead,
      modify: IModify,
      http: IHttp,
      persis: IPersistence
   ): Promise<IApiResponse> {
      try {
         let [{ nodes }, responseBody] = this.makeBodies(request.content)

         // -----------------------------------------------------------------------------------
         const db = new Neo4j(http)
         await db.verifyConnectivity()
         const embeddingModel = new MiniLML6(http)
         // -----------------------------------------------------------------------------------
         nodes = nodes.map((node) => {
            if ("element" in node) {
               return new DevDocDBNode(node)
            } else {
               return new DBNode(node)
            }
         })
         await Promise.all(nodes.map((x) => x.fillEmbeddings(embeddingModel)))
         // -----------------------------------------------------------------------------------
         const jobs = nodes.map((node) => db.run(node.getDBInsertQuery(), node))
         await Promise.all(jobs)
         // -----------------------------------------------------------------------------------

         return this.success(JSON.stringify(responseBody))
      } catch (e) {
         return this.success(JSON.stringify({ status: 500, error: e }))
      }
   }
}
