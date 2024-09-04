import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    ISlashCommand,
    SlashCommandContext,
} from "@rocket.chat/apps-engine/definition/slashcommands";
import { persistUIData } from "../utils/persistenceHandlers";
import { findSimilarModal } from "./FindSimilar.modal";

export class FindSimilarCommand implements ISlashCommand {
    public command = "rcc-findsimilar";
    public i18nParamsExample = "";
    public i18nDescription = "";
    public providesPreview = false;

    /**
     * Executes the FindSimilar command.
     * 
     * @param context - The SlashCommandContext object.
     * @param read - The IRead object.
     * @param modify - The IModify object.
     * @param http - The IHttp object.
     * @param persistence - The IPersistence object.
     * @returns A Promise that resolves to void.
     * @throws Error if no trigger ID is provided.
     */
    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persistence: IPersistence
    ): Promise<void> {
        const userID = context.getSender().id;
        await persistUIData(persistence, userID, context);

        const triggerId = context.getTriggerId();
        if (!triggerId) {
            throw new Error("No trigger ID provided");
        }

        await modify
            .getUiController()
            .openSurfaceView(
                await findSimilarModal(),
                { triggerId },
                context.getSender()
            );
    }
}
