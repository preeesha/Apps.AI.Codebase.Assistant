import {
    IHttp,
    IModify,
    IRead,
    IUIKitSurfaceViewParam,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import {
    IUIKitSurface,
    UIKitSurfaceType,
} from "@rocket.chat/apps-engine/definition/uikit";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { PromptFactory } from "../core/prompt.factory";
import { Query } from "../core/query";
import { Neo4j } from "../core/services/db/neo4j";
import { MiniLML6 } from "../core/services/embeddings/minilml6";
import { Llama3_70B } from "../core/services/llm/llama3_70B";
import { getButton, getInputBox } from "../utils/blockBuilders";
import { handleCommandResponse } from "../utils/handleCommandResponse";

export const COMMAND = "rcc-improve";
export const IMPROVE_COMMAND_MODAL = "improve-command";

/**
 * Helps to build the modal for `/rcc-improve` command.
 *
 * @returns A promise that resolves to an object of type IUIKitSurfaceViewParam used to open RC's modal.
 */
export async function improveModal(): Promise<IUIKitSurfaceViewParam> {
    return {
        id: IMPROVE_COMMAND_MODAL,
        type: UIKitSurfaceType.MODAL,
        title: {
            type: "plain_text",
            text: "Get Improvements",
        },
        close: await getButton("Close", "", ""),
        clearOnClose: true,
        submit: await getButton("Submit", "submit", "submit", "Submit"),
        blocks: [
            await getInputBox(
                "",
                "What code you want to get improvements for?",
                "improve",
                "improve",
                "",
                true
            ),
        ],
    };
}


/**
 * Processes the user's query to generate an answer based on the data in the database.
 * 
 * @param {IHttp} http - The HTTP client used for making requests.
 * @param {string} query - The user's query.
 * @returns {Promise<string | null>} A promise that resolves to the generated answer or null if no answer is found.
 */
async function process(http: IHttp, query: string): Promise<string | null> {
    const db = new Neo4j(http);
    const llm = new Llama3_70B(http);
    const embeddingModel = new MiniLML6(http);

    /**
     * ---------------------------------------------------------------------------------------------
     * STEP 1:
     * Extract the possible keywords from the user's query
     * ---------------------------------------------------------------------------------------------
     */
    const keywords = await Query.getDBKeywordsFromQuery(llm, query);
    if (!keywords.length) return null;

    /**
     * ---------------------------------------------------------------------------------------------
     * STEP 2:
     * Query the database to find the nodes names of which are similar to what user has requested
     * ---------------------------------------------------------------------------------------------
     */
    const codeNodes = await Query.getCodeNodesFromKeywords(
        db,
        embeddingModel,
        keywords
    );
    if (!codeNodes.length) return null;

    /**
     * ---------------------------------------------------------------------------------------------
     * STEP 3:
     * Generate the answer and diagram for the user's query given the nodes data
     * ---------------------------------------------------------------------------------------------
     */
    const answer = await llm.ask(
        PromptFactory.makeImprovePrompt(
            codeNodes.map((x) => x.code).join("\n\n"),
            query
        )
    );
    if (!answer) return null;

    return answer;
}

/**
 * Handles the submission of the improve modal form.
 * 
 * @param {IUIKitSurface} view - The UI Kit surface where the modal is being displayed.
 * @param {IUser} sender - The user who submitted the form.
 * @param {IRoom} room - The room where the form was submitted.
 * @param {IRead} read - The read utility object.
 * @param {IModify} modify - The modify utility object.
 * @param {IHttp} http - The HTTP utility object.
 * @returns {Promise<void>} - A promise that resolves when the submission is handled.
 */
export async function improveModalSubmitHandler(
    view: IUIKitSurface,
    sender: IUser,
    room: IRoom,
    read: IRead,
    modify: IModify,
    http: IHttp
) {
    const state = view.state as Record<string, any> | undefined;
    if (!state) return;

    const query = state.improve.improve;
    const sendMessage = await handleCommandResponse(
        "\n```typescript\n" + query + "\n```",
        sender,
        room,
        modify,
        COMMAND
    );

    const res = await process(http, query);
    if (res) {
        await sendMessage(res as string);
    } else {
        await sendMessage("❌ Failed to get improvements");
    }
}
