export interface ILLMModel {
    ask(prompt: string): Promise<string | null>;
}
