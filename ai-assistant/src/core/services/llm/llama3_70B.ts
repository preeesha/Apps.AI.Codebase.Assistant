import { IHttp } from "@rocket.chat/apps-engine/definition/accessors"

import { Prompt } from "../../prompt"
import { ILLMModel } from "./llm.types"

export class Llama3_70B implements ILLMModel {
   private http: IHttp
   private readonly model: string = "llama3"
   private readonly baseURL: string = "http://llama3-70b/v1"

   constructor(http: IHttp) {
      this.http = http
   }

   /**
    * Asynchronously asks a prompt and returns the response.
    *
    * @param {Prompt} prompt - The prompt to ask.
    * @returns {Promise<string | null>} A promise that resolves with the response string or null if no response is available.
    */
   async ask(prompt: Prompt): Promise<string | null> {
      let tries = 5
      while (tries--) {
         try {
            const url = `${this.baseURL}/chat/completions`
            const res = await this.http.post(url, {
               headers: {
                  "Content-Type": "application/json",
               },
               data: {
                  temperature: 0,
                  messages: prompt.messages,
               },
            })
            if (!res.content) return null

            // @ts-ignore
            const message = JSON.parse(res.content).choices[0].message.content
            console.log(message)

            return message
         } catch (e) {
            console.log(e)
         }
      }

      return null
   }
}
