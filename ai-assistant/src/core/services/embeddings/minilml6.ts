import { IHttp } from "@rocket.chat/apps-engine/definition/accessors"
import { IEmbeddingModel } from "./embeddings.types"

export class MiniLML6 implements IEmbeddingModel {
   private http: IHttp
   private readonly baseURL: string = "http://text-embedding-api:8020/embed_multiple"

   constructor(http: IHttp) {
      this.http = http
   }

   /**
    * Generates embeddings for the given text.
    * @param text - The input text for which embeddings need to be generated.
    * @returns A promise that resolves to an array of numbers representing the embeddings for the text, or null if the generation fails.
    */
   async generate(text: string): Promise<number[] | null> {
      let tries = 5
      while (tries--) {
         try {
            const res = await this.http.post(this.baseURL, {
               headers: {
                  accept: "application/json",
                  "Content-Type": "application/json",
               },
               data: [text],
            })
            if (!res || res.statusCode !== 200) return null

            const data = res.data["embeddings"][0] as number[]
            return data
         } catch (e) {
            console.log(e)
         }
      }

      return []
   }
}
