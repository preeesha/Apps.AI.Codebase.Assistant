import {
    IHttp,
    IModify,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { UIKitViewSubmitInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";
import {
    FIND_SIMILAR_COMMAND_MODAL,
    findSimilarModalSubmitHandler,
} from "../modals/findSimilarModal";
import {
    IMPROVE_COMMAND_MODAL,
    improveModalSubmitHandler,
} from "../modals/improveModal";
import { getUIData } from "./persistenceHandlers";

const MODALS: Record<string, any> = {
    [IMPROVE_COMMAND_MODAL]: improveModalSubmitHandler,
    [FIND_SIMILAR_COMMAND_MODAL]: findSimilarModalSubmitHandler,
};

export async function handleModalViewSubmit(
    context: UIKitViewSubmitInteractionContext,
    read: IRead,
    http: IHttp,
    modify: IModify
) {
    const { user, view } = context.getInteractionData();
    const slashCommandContext = await getUIData<SlashCommandContext>(
        read.getPersistenceReader(),
        user.id
    );

    if (!slashCommandContext) {
        context.getInteractionResponder().viewErrorResponse({
            viewId: view.id,
            errors: {
                error: "No data found",
            },
        });
        return;
    }

    const room = JSON.parse(JSON.stringify(slashCommandContext)).room as IRoom;

    let handler = MODALS[view.id];
    await handler(view, user, room, read, modify, http);

    return context.getInteractionResponder().successResponse();
}
