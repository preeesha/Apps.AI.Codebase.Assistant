import {
    IHttp,
    IModify,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    ISlashCommand,
    SlashCommandContext,
} from "@rocket.chat/apps-engine/definition/slashcommands";

import { Prompt } from "../core/prompt";
import { Llama3_70B } from "../core/services/llm/llama3_70B";
import { handleCommandResponse } from "../utils/handleCommandResponse";

export class TestCommand implements ISlashCommand {
    public command = "rcc-test";
    public i18nParamsExample = "";
    public i18nDescription = "";
    public providesPreview = false;

    private async process(http: IHttp, query: string): Promise<string | null> {
        const llm = new Llama3_70B(http);

        const prompt = new Prompt();
        prompt.pushUser(query);

        const answer = await llm.ask(prompt);
        if (!answer) return null;

        return answer;
    }

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp
    ): Promise<void> {
        const query = context.getArguments().join(" ");
        if (!query) return;

        const sendEditedMessage = await handleCommandResponse(
            query,
            context.getSender(),
            context.getRoom(),
            modify,
            this.command
        );

        const res = await this.process(http, query);
        if (res) {
            await sendEditedMessage(res);
        } else {
            await sendEditedMessage("❌ Unable to process your query");
        }
    }
}
