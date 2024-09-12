import { IHttp, IModify, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors"
import {
   ApiEndpoint,
   IApiEndpointInfo,
   IApiRequest,
   IApiResponse,
} from "@rocket.chat/apps-engine/definition/api"
import { IDB } from "../core/services/db/db.types"
import { Neo4j } from "../core/services/db/neo4j"
import {
   EstablishRelationsEndpointRelations,
   EstablishRelationsEndpointRequestBody,
   EstablishRelationsEndpointResponseBody,
} from "./establishRelations.types"

namespace Helpers {
   /**
    * Establishes a relation between two nodes in the database.
    *
    * @param {IDB} db - The database instance.
    * @param {string} sourceID - The ID of the source node.
    * @param {string} targetID - The ID of the target node.
    * @param {string} relation - The type of relation to establish between the nodes.
    * @returns {Promise<void>} - A promise that resolves when the relation is successfully established.
    */
   async function establishRelation(db: IDB, sourceID: string, targetID: string, relation: string) {
      const query = [
         `MATCH (n { id: $sourceID })`,
         `MATCH (m { id: $targetID })`,
         `CREATE (n)-[:${relation}]->(m)\n`,
      ].join("\n")
      try {
         await db.run(query, { sourceID, targetID })
      } catch (e) {
         console.error(e)
      }
   }

   /**
    * Establishes relations between entities in the database.
    *
    * @param {IDB} db - The database instance.
    * @param {EstablishRelationsEndpointRelations[]} relations - An array of objects representing the relations to be established.
    * @returns {Promise<void>} - A promise that resolves when all relations have been established.
    */
   export async function establishRelations(db: IDB, relations: EstablishRelationsEndpointRelations[]) {
      const jobs: Promise<any>[] = []
      for (const relation of relations) {
         const job = establishRelation(db, relation.source, relation.target, relation.relation)
         jobs.push(job)
      }
      await Promise.all(jobs)
   }
}

export class EstablishRelationsEndpoint extends ApiEndpoint {
   public path = "establishRelations"

   /**
    * Generates the request and response bodies for the EstablishRelationsEndpoint.
    *
    * @param content - The content to be used for generating the request and response bodies.
    * @returns An array containing the generated request body and response body.
    */
   makeBodies(content: any): [EstablishRelationsEndpointRequestBody, EstablishRelationsEndpointResponseBody] {
      const requestBody = content as EstablishRelationsEndpointRequestBody
      const responseBody: EstablishRelationsEndpointResponseBody = {
         status: 200,
      }

      return [requestBody, responseBody]
   }

   /**
    * Commits the progress of the database transaction.
    *
    * @param {IDB} db - The database instance.
    * @returns {Promise<number>} - A promise that resolves to the status code indicating the success or failure of the commit operation.
    *                            - Returns 200 if the commit is successful.
    *                            - Returns 500 if an error occurs during the commit or rollback operation.
    */
   async commitProgress(db: IDB): Promise<EstablishRelationsEndpointResponseBody["status"]> {
      try {
         try {
            await db.commitTransaction()
         } catch (e) {
            console.error(e)
            await db.rollbackTransaction()

            return 500
         }
      } catch (e) {
         console.error(e)
         return 500
      }

      return 200
   }

   public async post(
      request: IApiRequest,
      endpoint: IApiEndpointInfo,
      read: IRead,
      modify: IModify,
      http: IHttp,
      persis: IPersistence
   ): Promise<IApiResponse> {
      let [{ relations }, responseBody] = this.makeBodies(request.content)

      const db = new Neo4j(http)
      await db.verifyConnectivity()
      // -----------------------------------------------------------------------------------
      await db.beginTransaction()
      await Helpers.establishRelations(db, relations)
      responseBody.status = await this.commitProgress(db)
      // -----------------------------------------------------------------------------------

      return this.success(JSON.stringify(responseBody))
   }
}
