import { Prompt } from "../../prompt";

export interface ILLMModel {
    ask(prompt: Prompt): Promise<string | null>;
}
