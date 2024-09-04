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

export const COMMAND = "rcc-testcases";
export const TESTCASES_COMMAND_MODAL = "testcases-command";

/**
 * Helps to build the modal for `/rcc-testcases` command.
 *
 * @returns A promise that resolves to an object of type IUIKitSurfaceViewParam used to open RC's modal.
 */
export async function testcasesModal(): Promise<IUIKitSurfaceViewParam> {
    return {
        id: TESTCASES_COMMAND_MODAL,
        type: UIKitSurfaceType.MODAL,
        title: {
            type: "plain_text",
            text: "Generate Testcases",
        },
        close: await getButton("Close", "", ""),
        clearOnClose: true,
        submit: await getButton("Submit", "submit", "submit", "Submit"),
        blocks: [
            await getInputBox(
                "",
                "What code you want to generate test cases for?",
                "testcases",
                "testcases",
                "",
                true
            ),
        ],
    };
}

/**
 * Processes the given query by extracting keywords, querying the database, and generating test cases.
 *
 * @param http - The HTTP client used for making requests.
 * @param query - The user's query.
 * @returns A promise that resolves to a string representing the generated test cases, or null if no test cases were generated.
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
     * Generate the test cases for the code nodes
     * ---------------------------------------------------------------------------------------------
     */
    const answer = await llm.ask(
        PromptFactory.makeTestcasesPrompt(
            codeNodes.map((x) => x.code).join("\n\n"),
            query,
            "playwright"
        )
    );
    if (!answer) return null;

    return answer;
}

/**
 * Handles the submission of the testcases modal.
 *
 * @param {IUIKitSurface} view - The UI Kit surface.
 * @param {IUser} sender - The user who triggered the event.
 * @param {IRoom} room - The room where the event occurred.
 * @param {IRead} read - The read utility.
 * @param {IModify} modify - The modify utility.
 * @param {IHttp} http - The HTTP utility.
 * @returns {Promise<void>} - A promise that resolves when the function is complete.
 */
export async function testcasesModalSubmitHandler(
    view: IUIKitSurface,
    sender: IUser,
    room: IRoom,
    read: IRead,
    modify: IModify,
    http: IHttp
) {
    const state = view.state as Record<string, any> | undefined;
    if (!state) return;

    const query = state.testcases.testcases;
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
        await sendMessage("❌ Failed to get test cases");
    }
}
