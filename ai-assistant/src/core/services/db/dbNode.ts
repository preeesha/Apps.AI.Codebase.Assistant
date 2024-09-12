import { IEmbeddingModel } from "../embeddings/embeddings.types"

export type DBNodeRelationType = "CONTAINS" | "USES"
export type DBNodeRelation = { target: string; relation: DBNodeRelationType }

export class DBNode {
   id: string
   name: string
   type: string

   code: string

   filePath: string
   relations: DBNodeRelation[]

   nameEmbeddings: number[]
   codeEmbeddings: number[]

   isFile: boolean
   descriptor: "Node" | string

   constructor(node: {
      id: string
      name: string
      type: string
      code: string
      filePath: string
      relations: DBNodeRelation[]
      nameEmbeddings: number[]
      codeEmbeddings: number[]
      descriptor: "Node" | string

      isFile?: boolean
   }) {
      this.id = node.id
      this.name = node.name
      this.type = node.type

      this.code = node.code

      this.filePath = node.filePath
      this.relations = node.relations

      this.nameEmbeddings = node.nameEmbeddings
      this.codeEmbeddings = node.codeEmbeddings

      this.isFile = node.isFile || false
      this.descriptor = node.descriptor
   }

   /**
    * Fills the embeddings for the given embedding model.
    *
    * @param {IEmbeddingModel} embeddingModel - The embedding model used to generate embeddings.
    * @returns {Promise<void>} - A promise that resolves when the embeddings are filled.
    */
   async fillEmbeddings(embeddingModel: IEmbeddingModel): Promise<void> {
      this.nameEmbeddings = (await embeddingModel.generate(this.name)) ?? []
      this.codeEmbeddings = (await embeddingModel.generate(this.code)) ?? []
   }

   /**
    * Generates a database insert query for creating a new node with the specified properties.
    *
    * @returns The database insert query as a string.
    */
   getDBInsertQuery(): string {
      let query = ""
      query += `
            CREATE (n:${this.descriptor} {
                id: $id,
                name: $name,
                type: $type,

                code: $code,
                filePath: $filePath,

                nameEmbeddings: $nameEmbeddings,
                codeEmbeddings: $codeEmbeddings
            })
        `

      return query
   }
}
