import { IHttp } from "@rocket.chat/apps-engine/definition/accessors";

import { HF_TOKEN } from "../../../credentials";
import { Prompt } from "../../prompt";
import { ILLMModel } from "./llm.types";

export class Llama3_70B implements ILLMModel {
    private http: IHttp;
    private readonly model: string = "llama3";
    private readonly baseURL: string = "http://llama3-70b/v1";

    constructor(http: IHttp) {
        this.http = http;
    }

    async fromHuggingFace(prompt: Prompt): Promise<string | null> {
        const url = `https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1/v1/chat/completions`;
        const res = await this.http.post(url, {
            headers: {
                "Content-Type": "application/json",
                authorization: "Bearer " + HF_TOKEN,
            },
            data: {
                temprature: 0,
                messages: prompt.messages,
                model: "mistralai/Mistral-7B-Instruct-v0.1",
                stream: false,
                max_tokens: 10000,
            },
        });
        if (!res.content) return null;

        const message = JSON.parse(res.content).choices[0].message.content;
        console.log(message);

        return message;
    }

    async ask(prompt: Prompt): Promise<string | null> {
        return await this.fromHuggingFace(prompt);

        const url = `${this.baseURL}/chat/completions`;
        const res = await this.http.post(url, {
            headers: {
                "Content-Type": "application/json",
            },
            data: {
                messages: prompt.messages,
            },
        });
        if (!res.content) return null;

        // @ts-ignore
        const message = JSON.parse(res.content).choices[0].message.content;
        return message;
    }
}
