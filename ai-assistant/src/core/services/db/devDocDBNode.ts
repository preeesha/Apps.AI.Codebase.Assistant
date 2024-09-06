import { IEmbeddingModel } from "../embeddings/embeddings.types";

export type DevDocDBNodeRelationType = "CONTAINS";
export type DevDocDBNodeRelation = {
    target: string;
    relation: DevDocDBNodeRelationType;
};

export class DevDocDBNode {
    id: string;
    relations: DevDocDBNodeRelation[];

    url: string;
    element: string;

    content: string;
    contentEmbeddings: number[];

    constructor(node: {
        id: string;
        relations: DevDocDBNodeRelation[];

        url: string;
        element: string;

        content: string;
        contentEmbeddings: number[];
    }) {
        this.id = node.id;
        this.relations = node.relations;

        this.url = node.url;
        this.element = node.element;

        this.content = node.content;
        this.contentEmbeddings = node.contentEmbeddings;
    }

    /**
     * Fills the embeddings for the given embedding model.
     *
     * @param {IEmbeddingModel} embeddingModel - The embedding model used to generate embeddings.
     * @returns {Promise<void>} - A promise that resolves when the embeddings are filled.
     */
    async fillEmbeddings(embeddingModel: IEmbeddingModel): Promise<void> {
        this.contentEmbeddings =
            (await embeddingModel.generate(this.content)) ?? [];
    }

    /**
     * Generates a database insert query for creating a new node with the specified properties.
     *
     * @returns The database insert query as a string.
     */
    getDBInsertQuery(): string {
        let query = "";
        query += `
            CREATE (n:DevDocDBNode {
                id: $id,

                url: $url,
                element: $element,

                content: $content,
                contentEmbeddings: $contentEmbeddings
            })
        `;

        return query;
    }
}
