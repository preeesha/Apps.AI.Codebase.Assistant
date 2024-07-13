import { IHttp } from "@rocket.chat/apps-engine/definition/accessors";

export interface IEmbeddingModel {
    generate(http: IHttp, text: string): Promise<number[] | null>;
}
