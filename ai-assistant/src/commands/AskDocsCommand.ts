import { IHttp, IModify, IRead } from "@rocket.chat/apps-engine/definition/accessors"
import { ISlashCommand, SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands"

import { PromptFactory } from "../core/prompt.factory"
import { Query } from "../core/query"
import { Neo4j } from "../core/services/db/neo4j"
import { MiniLML6 } from "../core/services/embeddings/minilml6"
import { Llama3_70B } from "../core/services/llm/llama3_70B"
import { handleCommandResponse } from "../utils/handleCommandResponse"

export class AskDocsCommand implements ISlashCommand {
   public command = "rcc-askdocs"
   public i18nParamsExample = ""
   public i18nDescription = ""
   public providesPreview = false

   /**
    * Processes the user's query and returns the answer.
    *
    * @param {IHttp} http - The HTTP object used for making requests.
    * @param {string} query - The user's query.
    * @returns {Promise<string | null>} A promise that resolves to the response to be given to the user or `null` if no answer or no reference is found.
    */
   private async process(http: IHttp, query: string): Promise<string | null> {
      const db = new Neo4j(http)
      const llm = new Llama3_70B(http)
      const embeddingModel = new MiniLML6(http)

      /**
       * ---------------------------------------------------------------------------------------------
       * STEP 1:
       * Query the database to find the nodes names of which are similar to what user has requested
       * ---------------------------------------------------------------------------------------------
       */
      const results = await Query.getDocsNodesFromQuery(db, embeddingModel, query)
      if (!results.length) return null

      /**
       * ---------------------------------------------------------------------------------------------
       * STEP 2:
       * Generate the answer and diagram for the user's query given the nodes data
       * ---------------------------------------------------------------------------------------------
       */
      const uniqueSources = [...new Set<string>(results.map((x) => x.url))]
      const answer = await llm.ask(
         PromptFactory.makeAskDocsPrompt(results.map((x) => x.content).join("\n\n"), uniqueSources, query)
      )
      if (!answer) return null

      return answer
   }

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

      const res = await this.process(http, query)
      if (res) {
         await sendEditedMessage(res)
      } else {
         await sendEditedMessage("❌ Unable to process your query")
      }
   }
}
