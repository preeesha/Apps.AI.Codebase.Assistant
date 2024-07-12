import { IEmbeddingModel } from "./embeddings.types";

export class MiniLML6 implements IEmbeddingModel {
    async generate(text: string): Promise<number[]> {
        throw new Error("Not implemented");
    }
}
