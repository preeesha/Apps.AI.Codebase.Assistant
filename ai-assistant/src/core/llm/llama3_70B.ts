import { IHttp } from "@rocket.chat/apps-engine/definition/accessors";
import { ILLMModel } from "./llm.types";

export class Llama3_70B implements ILLMModel {
    private http: IHttp;
    private readonly baseURL: string = "http://llama3-70b/v1";

    constructor(http: IHttp) {
        this.http = http;
    }

    ask(prompt: string): Promise<string | null> {
        throw new Error("Not implemented");
    }
}
