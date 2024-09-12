import { IHttp, IModify, IRead } from "@rocket.chat/apps-engine/definition/accessors"
import { ISlashCommand, SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands"
import { PromptFactory } from "../core/prompt.factory"
import { Query } from "../core/query"
import { Neo4j } from "../core/services/db/neo4j"
import { MiniLML6 } from "../core/services/embeddings/minilml6"
import { Llama3_70B } from "../core/services/llm/llama3_70B"
import { handleCommandResponse } from "../utils/handleCommandResponse"

export class TranslateCommand implements ISlashCommand {
   public command = "rcc-translate"
   public i18nParamsExample = ""
   public i18nDescription = ""
   public providesPreview = false

   /**
    * Processes the translation command.
    *
    * @param {IHttp} http - The HTTP client.
    * @param {string} targetLanguage - The target language for translation.
    * @param {string} targetEntity - The target entity for translation.
    * @returns {Promise<string | null>} A promise that resolves to the translated result or null if no translation is found.
    */
   private async process(http: IHttp, targetLanguage: string, targetEntity: string): Promise<string> {
      const db = new Neo4j(http)
      const llm = new Llama3_70B(http)
      const embeddingModel = new MiniLML6(http)

      /**
       * ---------------------------------------------------------------------------------------------
       * STEP 1:
       * Query the database to find the nodes names of which are similar to what user has requested
       * ---------------------------------------------------------------------------------------------
       */
      const codeNodes = await Query.getCodeNodesFromKeywords(db, embeddingModel, [targetEntity])
      if (!codeNodes.length) return "I'm sorry, I couldn't find any code related to your query."

      /**
       * ---------------------------------------------------------------------------------------------
       * STEP 2:
       * Generate the documentation based on the code nodes and user's query
       * ---------------------------------------------------------------------------------------------
       */
      const res = await llm.ask(
         PromptFactory.makeTranslatePrompt(
            codeNodes.map((x) => x.code).join("\n\n"),
            targetEntity,
            targetLanguage
         )
      )
      if (!res) return "I'm sorry, I'm having trouble connecting to the server. Please try again later."

      return res
   }

   /**
    * Executes the TranslateCommand.
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
      const [targetEntity, targetLanguage] = context.getArguments()
      if (!targetEntity || !targetLanguage) {
         const errorMessage = modify.getCreator().startMessage()
         errorMessage.setSender(context.getSender()).setRoom(context.getRoom()).setText("Invalid arguments!")
         await modify.getCreator().finish(errorMessage)
         return
      }

      const sendEditedMessage = await handleCommandResponse(
         `${targetEntity} ${targetLanguage}`,
         context.getSender(),
         context.getRoom(),
         modify,
         this.command
      )

      const res = await this.process(http, targetEntity, targetLanguage)
      await sendEditedMessage(res)
   }
}
