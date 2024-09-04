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
