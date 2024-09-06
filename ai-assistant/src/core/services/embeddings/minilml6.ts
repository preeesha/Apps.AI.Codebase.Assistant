import { IHttp } from "@rocket.chat/apps-engine/definition/accessors";
import { HF_TOKEN } from "../../../credentials";
import { IEmbeddingModel } from "./embeddings.types";

export class MiniLML6 implements IEmbeddingModel {
    private http: IHttp;
    private readonly baseURL: string =
        "http://text-embedding-api:8020/embed_multiple";

    constructor(http: IHttp) {
        this.http = http;
    }

    /**
     * Extracts embeddings from Hugging Face API using the MiniLM-L6 model.
     * @param text - The input text to extract embeddings from.
     * @returns A promise that resolves to an array of numbers representing the embeddings, or null if the request fails.
     */
    async fromHuggingFace(text: string): Promise<number[] | null> {
        const res = await this.http.post(
            `https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2`,
            {
                headers: {
                    accept: "application/json",
                    "Content-Type": "application/json",
                    authorization: "Bearer " + HF_TOKEN,
                },
                data: {
                    inputs: [text],
                    options: {
                        wait_for_model: true,
                    },
                },
            }
        );
        if (!res || res.statusCode !== 200) return null;

        const data = res.data[0] as number[];
        return data;
    }

    /**
     * Generates embeddings for the given text.
     * @param text - The input text for which embeddings need to be generated.
     * @returns A promise that resolves to an array of numbers representing the embeddings for the text, or null if the generation fails.
     */
    async generate(text: string): Promise<number[] | null> {
        return await this.fromHuggingFace(text);

        const res = await this.http.post(this.baseURL, {
            headers: {
                accept: "application/json",
                "Content-Type": "application/json",
            },
            data: [text],
        });
        if (!res || res.statusCode !== 200) return null;

        const data = res.data["embeddings"][0] as number[];
        return data;
    }
}
