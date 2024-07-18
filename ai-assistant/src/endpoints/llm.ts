import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    ApiEndpoint,
    IApiEndpointInfo,
    IApiRequest,
    IApiResponse,
} from "@rocket.chat/apps-engine/definition/api";

export class LLMEndpoint extends ApiEndpoint {
    public path = "llm";

    public async post(
        request: IApiRequest,
        endpoint: IApiEndpointInfo,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<IApiResponse> {
        const url = `http://mistral-7b/v1/chat/completions`;
        const res = await http.post(url, {
            headers: {
                "Content-Type": "application/json",
            },
            data: {
                model: "mistral",
                temprature: 0,
                messages: request.content.messages,
            },
        });

        return this.success(res);
    }
}
