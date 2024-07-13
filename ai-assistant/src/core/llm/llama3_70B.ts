import { IHttp } from "@rocket.chat/apps-engine/definition/accessors";
import { Prompt } from "../prompt/prompt";
import { ILLMModel } from "./llm.types";

export class Llama3_70B implements ILLMModel {
    private http: IHttp;
    private readonly model: string = "llama3";
    private readonly baseURL: string = "http://llama3-70b/v1";

    constructor(http: IHttp) {
        this.http = http;
    }

    async ask(prompt: Prompt): Promise<string | null> {
        this.http.post(this.baseURL, {
            headers: {
                "Content-Type": "application/json",
            },
            data: {
                model: this.model,
                messages: prompt.messages,
            },
        });

        return null;
    }
}
