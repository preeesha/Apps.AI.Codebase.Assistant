export type DBNodeRelation = "CONTAINS" | "USES";

export class DBNode {
    id: string;
    name: string;
    type: string;

    code: string;

    filePath: string;
    relations: { target: string; relation: DBNodeRelation }[];

    nameEmbeddings: number[];
    codeEmbeddings: number[];

    isFile: boolean;
    descriptor: "Node" | string;
}
