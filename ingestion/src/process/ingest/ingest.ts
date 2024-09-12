import { readFileSync, readdirSync } from "fs"
import path from "path"
import { v4 as uuid } from "uuid"

import { RC_APP_URI } from "../../constants"
import { DBNode, DBNodeRelation } from "../../core/dbNode"
import { DevDocDBNodeRelation } from "../../core/devDocDBNode"

namespace Algorithms {
   export async function purgeDB(): Promise<boolean> {
      try {
         const res = await fetch(`${RC_APP_URI}/purgeDB`, {
            method: "POST",
            headers: {
               accept: "application/json",
               "Content-Type": "application/json",
            },
         })

         return res.status === 200
      } catch (e) {
         console.log(e)
         return false
      }
   }

   export async function insertBatch(batchID: string, nodes: DBNode[]): Promise<boolean> {
      let tries = 5
      while (tries--) {
         try {
            const res = await fetch(`${RC_APP_URI}/ingest`, {
               method: "POST",
               headers: {
                  accept: "application/json",
                  "Content-Type": "application/json",
               },
               body: JSON.stringify({ nodes, batchID }),
            })

            if (res.status !== 200) {
               console.log(res)
               return false
            }

            return true
            // return res.status === 200
         } catch (e) {
            console.log(e)
         }
      }
      return false
   }

   export async function establishRelations(relations: DBNodeRelation[]): Promise<boolean> {
      try {
         const res = await fetch(`${RC_APP_URI}/establishRelations`, {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify({ relations }),
         })

         return res.status === 200
      } catch (e) {
         console.log(e)
         return false
      }
   }
}

export async function insertDataIntoDB(batchesDirPath: string) {
   console.log("🕒 Inserting")

   const files = readdirSync(batchesDirPath).map((file) => path.resolve(batchesDirPath, file))

   // /* Step 1: Empty DB */
   {
      const success = await Algorithms.purgeDB()
      if (!success) {
         console.log("❌ Error emptying db")
         return
      }

      console.log("🕒 Purged DB")
   }

   /* Step 2: Insert batch */
   {
      const errorBatches: Set<string> = new Set()

      const relations: (DBNodeRelation | DevDocDBNodeRelation)[] = []

      // Insert each batch
      let batches: string[][] = []
      for (let i = 0; i < files.length; i += 10) {
         batches.push(files.slice(i, i + 10))
      }

      console.log("🕒 Waiting for batches")
      for (const group of batches) {
         const batchID = uuid()
         const nodes: DBNode[] = []

         for (const file of group) {
            const data = readFileSync(file, "utf-8")
            nodes.push(...(Object.values(JSON.parse(data)) as DBNode[]))

            for (const node of nodes) {
               relations.push(
                  ...node.relations.map((relation) => ({
                     source: node.id,
                     target: relation.target,
                     relation: relation.relation,
                  }))
               )
            }
         }

         const success = await Algorithms.insertBatch(batchID, nodes)
         if (success) {
            console.log(`📦 ${batchID} inserted`)
         } else {
            console.log(`❌ Error inserting ${batchID}`)
            errorBatches.add(batchID)
         }

         await new Promise((resolve) => setTimeout(resolve, 3_000))
      }

      console.log("📦 All batches inserted")

      if (errorBatches.size > 0) console.log("❌ Error batches", errorBatches)

      // Establish relations
      const batchSize = 1000
      for (let i = 0; i < relations.length; i += batchSize) {
         const success = await Algorithms.establishRelations(relations.slice(i, i + batchSize))
         if (success) {
            console.log(`🔗 Relations established ${i + 1000}/${relations.length}`)
         } else {
            console.log(`❌ Error establishing relations ${i + 1000}/${relations.length}`)
         }
      }

      console.log("🔗 All Relations established")
   }

   console.log("✅ Inserted")
}
