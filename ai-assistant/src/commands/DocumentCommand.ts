import { IHttp, IModify, IRead } from "@rocket.chat/apps-engine/definition/accessors"
import { ISlashCommand, SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands"
import { PromptFactory } from "../core/prompt.factory"
import { Query } from "../core/query"
import { Neo4j } from "../core/services/db/neo4j"
import { MiniLML6 } from "../core/services/embeddings/minilml6"
import { Llama3_70B } from "../core/services/llm/llama3_70B"
import { handleCommandResponse } from "../utils/handleCommandResponse"

export class DocumentCommand implements ISlashCommand {
   public command = "rcc-document"
   public i18nParamsExample = ""
   public i18nDescription = ""
   public providesPreview = false

   /**
    * Processes the HTTP request and query to generate documentation.
    *
    * @param http - The HTTP client.
    * @param query - The user's query.
    * @returns A promise that resolves to an object containing the generated JSDoc and explanation, or null if no references are found or the documentation could be generated.
    */
   private async process(
      http: IHttp,
      query: string
   ): Promise<{ jsDoc: string; explanation: string | null } | string> {
      const db = new Neo4j(http)
      const llm = new Llama3_70B(http)
      const embeddingModel = new MiniLML6(http)

      /**
       * ---------------------------------------------------------------------------------------------
       * STEP 1:
       * Extract the possible keywords from the user's query
       * ---------------------------------------------------------------------------------------------
       */
      const keywords = await Query.getDBKeywordsFromQuery(llm, query)
      if (!keywords.length) return "I'm sorry, I couldn't understand your query. Please try again."

      /**
       * ---------------------------------------------------------------------------------------------
       * STEP 2:
       * Query the database to find the nodes names of which are similar to what user has requested
       * ---------------------------------------------------------------------------------------------
       */
      const codeNodes = await Query.getCodeNodesFromKeywords(db, embeddingModel, keywords)
      if (!codeNodes.length) return "I'm sorry, I couldn't find any code related to your query."

      /**
       * ---------------------------------------------------------------------------------------------
       * STEP 3:
       * Generate the documentation based on the code nodes and user's query
       * ---------------------------------------------------------------------------------------------
       */
      const result = await llm.ask(PromptFactory.makeDocumentPrompt(JSON.stringify(codeNodes), query))
      if (!result) return "I'm sorry, I couldn't generate documentation for your query."

      //@ts-ignore
      const jsDoc = result.split("<JSDOC_START>")[1].split("<JSDOC_END>")[0].trim()
      //@ts-ignore
      const explanation = result.split("<EXPLANATION_START>")[1].split("<EXPLANATION_END>")[0].trim()

      return {
         jsDoc: "```typescript\n" + jsDoc + "\n```",
         explanation: explanation,
      }
   }

   /**
    * Executes the command to retrieve and display documentation for a given query.
    *
    * @param context - The SlashCommandContext object containing information about the command execution.
    * @param read - The IRead object used to read data from the Rocket.Chat server.
    * @param modify - The IModify object used to modify data on the Rocket.Chat server.
    * @param http - The IHttp object used to make HTTP requests.
    * @returns A Promise that resolves to void.
    */
   public async executor(
      context: SlashCommandContext,
      read: IRead,
      modify: IModify,
      http: IHttp
   ): Promise<void> {
      const query = context.getArguments().join(" ")
      if (!query) return

      const sendEditedMessage = await handleCommandResponse(
         query,
         context.getSender(),
         context.getRoom(),
         modify,
         this.command
      )

      let res = await this.process(http, query)
      if (typeof res === "string") {
         await sendEditedMessage(res)
      } else {
         await sendEditedMessage(`${res.jsDoc}\n\n${res.explanation}`)
      }
   }
}
