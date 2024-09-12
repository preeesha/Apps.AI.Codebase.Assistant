import { Prompt } from "../../prompt"

export interface ILLMModel {
   /**
    * Asynchronously asks a prompt and returns the response.
    *
    * @param {Prompt} prompt - The prompt to ask.
    * @returns {Promise<string | null>} A promise that resolves with the response string or null if no response is available.
    */
   ask(prompt: Prompt): Promise<string | null>
}
