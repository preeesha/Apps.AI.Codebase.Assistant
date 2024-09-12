import { DBNode } from "../core/services/db/dbNode"
import { DevDocDBNode } from "../core/services/db/devDocDBNode"

export type IngestEndpointRequestBody = {
   batchID: string
   nodes: (DBNode | DevDocDBNode)[]
}

export type IngestEndpointResponseBody = {
   batchID: string
   status: 200 | 500
}
