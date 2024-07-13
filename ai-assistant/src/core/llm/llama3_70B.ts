import { ILLMModel } from "./llm.types";

export class Llama3_70B implements ILLMModel {
    readonly baseURL: string = "http://llama3-70b/v1";

    ask(prompt: string): Promise<string | null> {
        throw new Error("Not implemented");
    }
}
