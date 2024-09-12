import { IHttp, IModify, IRead } from "@rocket.chat/apps-engine/definition/accessors"
import { ISlashCommand, SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands"

import { renderDiagramToBase64URI } from "../core/diagram"
import { PromptFactory } from "../core/prompt.factory"
import { Query } from "../core/query"
import { Neo4j } from "../core/services/db/neo4j"
import { MiniLML6 } from "../core/services/embeddings/minilml6"
import { Llama3_70B } from "../core/services/llm/llama3_70B"
import { handleCommandResponse } from "../utils/handleCommandResponse"

export class DiagramCommand implements ISlashCommand {
   public command = "rcc-diagram"
   public i18nParamsExample = ""
   public i18nDescription = ""
   public providesPreview = false

   private async process(http: IHttp, query: string): Promise<string | null> {
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
      if (!keywords.length) return null

      /**
       * ---------------------------------------------------------------------------------------------
       * STEP 2:
       * Query the database to find the nodes names of which are similar to what user has requested
       * ---------------------------------------------------------------------------------------------
       */
      const results = await Query.getCodeNodesFromKeywords(db, embeddingModel, keywords)
      if (!results.length) return null

      /**
       * ---------------------------------------------------------------------------------------------
       * STEP 3:
       * Generate the diagram code and diagram for the user's query given the nodes data
       * ---------------------------------------------------------------------------------------------
       */
      const diagram = await llm.ask(
         PromptFactory.makeDiagramPrompt(results.map((x) => x.code).join("\n\n"), query)
      )
      console.log(diagram)
      if (!diagram) return null

      const diagramContent = diagram
         .replace("```mermaid", "")
         .replace("```", "")
         .split("<DIAGRAM_START>")[1]
         .split("<DIAGRAM_END>")[0]
         .trim()

      const base64Diagram = await renderDiagramToBase64URI(http, diagramContent)
      return base64Diagram
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

      let res = await this.process(http, query)
      if (res) {
         await sendEditedMessage("", [res])
      } else {
         await sendEditedMessage("❌ Diagram cannot be generated.")
      }
   }
}
