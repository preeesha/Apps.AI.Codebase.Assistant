import { ILLMModel } from "./llm.types";

export class Llama3 implements ILLMModel {
    ask(prompt: string): Promise<string | null> {
        throw new Error("Not implemented");
    }
}
