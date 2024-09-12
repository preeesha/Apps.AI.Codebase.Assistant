export type PromptRole = "user" | "assistant" | "system"
export type PromptMessage = { role: PromptRole; content: string }
export type PromptMessages = PromptMessage[]

export class Prompt {
   private _messages: PromptMessages = []
   get messages() {
      return this._messages
   }
   set messages(messages: PromptMessages) {
      this._messages = messages
   }

   /**
    * Parses the content of a prompt by removing leading and trailing whitespace from each line.
    *
    * @param content - The content of the prompt to be parsed.
    * @returns The parsed content with leading and trailing whitespace removed from each line.
    */
   private parsePromptContent(content: string): string {
      return content
         .split("\n")
         .map((x) => x.trim())
         .join("\n")
         .trim()
   }

   /**
    * Pushes a system message to the message list.
    *
    * @param {string} content - The content of the system message.
    * @returns {void}
    */
   pushSystem(content: string) {
      this._messages.push({
         role: "system",
         content: this.parsePromptContent(content),
      })
   }

   /**
    * Adds a message from the assistant to the message list.
    *
    * @param {string} content - The content of the message.
    * @returns {void}
    */
   pushAssistant(content: string) {
      this._messages.push({
         role: "assistant",
         content: this.parsePromptContent(content),
      })
   }

   /**
    * Adds a user message to the message list.
    *
    * @param {string} content - The content of the user message.
    * @returns {void}
    */
   pushUser(content: string) {
      this._messages.push({
         role: "user",
         content: this.parsePromptContent(content),
      })
   }
}
