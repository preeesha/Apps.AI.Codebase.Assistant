import { IHttp, IModify, IRead } from "@rocket.chat/apps-engine/definition/accessors"
import { ISlashCommand, SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands"
import { Neo4j } from "../core/services/db/neo4j"
// import { renderDiagramToBase64URI } from "../core/diagram";
import { PromptFactory } from "../core/prompt.factory"
import { Query } from "../core/query"
import { MiniLML6 } from "../core/services/embeddings/minilml6"
import { Llama3_70B } from "../core/services/llm/llama3_70B"
import { handleCommandResponse } from "../utils/handleCommandResponse"
import { renderDiagramToBase64URI } from "../core/diagram"

export class WhyUsedCommand implements ISlashCommand {
   public command = "rcc-whyused"
   public i18nParamsExample = ""
   public i18nDescription = ""
   public providesPreview = false

   /**
    * Processes the user's query to find the explanation and diagram for the requested code nodes.
    *
    * @param http - The HTTP client used for making requests.
    * @param query - The user's query.
    * @returns A promise that resolves to an object containing the explanation and diagram, or null if no data is found.
    */
   private async process(
      http: IHttp,
      query: string
   ): Promise<
      | {
           explanation: string
           diagram: string
        }
      | string
   > {
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
       * Generate the answer and diagram for the user's query given the nodes data
       * ---------------------------------------------------------------------------------------------
       */
      const result = await llm.ask(
         PromptFactory.makeWhyUsedPrompt(codeNodes.map((x) => x.code).join("\n\n"), query)
      )
      if (!result) return "I'm sorry, I couldn't find any references for your query."

      const explanation = result.split("<EXPLANATION>")[1].split("</EXPLANATION>")[0].trim()
      const diagram = result.split("<DIAGRAM>")[1].split("</DIAGRAM>")[0].trim()

      /**
       * ---------------------------------------------------------------------------------------------
       * STEP 4:
       * Generate the diagram for the user's query given the nodes data
       * ---------------------------------------------------------------------------------------------
       */
      const data = { explanation, diagram: "" }
      if (diagram) {
         const parsedDiagram = diagram.replace("```mermaid", "").replace("```", "").trim()
         try {
            data.diagram = await renderDiagramToBase64URI(http, parsedDiagram)
         } catch {}
      }

      return data
   }

   /**
    * Executes the WhyUsedCommand.
    *
    * @param {SlashCommandContext} context - The context of the slash command.
    * @param {IRead} read - The read utility.
    * @param {IModify} modify - The modify utility.
    * @param {IHttp} http - The HTTP utility.
    * @returns {Promise<void>} - A promise that resolves when the execution is complete.
    */
   public async executor(
      context: SlashCommandContext,
      read: IRead,
      modify: IModify,
      http: IHttp
   ): Promise<void> {
      const [query] = context.getArguments()
      if (!query) return

      const sendEditedMessage = await handleCommandResponse(
         query,
         context.getSender(),
         context.getRoom(),
         modify,
         this.command
      )

      const res = await this.process(http, query)
      if (typeof res === "string") {
         await sendEditedMessage(res)
         return
      }
      await sendEditedMessage(res.explanation, [res.diagram!])
   }
}
