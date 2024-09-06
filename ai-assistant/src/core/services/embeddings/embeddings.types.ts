/**
 * Generates an embedding for the given text.
 *
 * @param text - The input text for which the embedding needs to be generated.
 * @returns A promise that resolves to a 1D array of numbers representing the embedding of the text, or null if the embedding cannot be generated.
 */
export interface IEmbeddingModel {
    generate(text: string): Promise<number[] | null>;
}
