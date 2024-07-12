export class Prompt {
    private systemPrompt: string;
    private assistantPrompt: string;

    constructor(systemPrompt: string, assistantPrompt: string) {
        this.systemPrompt = systemPrompt;
        this.assistantPrompt = assistantPrompt;
    }

    /* TODO: Add format checking or use langchain */
    /**
     * Example:
     * <s>
     *     [INST]
     *         You are a human.
     *     [/INST]
     *     I am a machine but I can help you.
     *
     *     [INST]
     *         Yeah but you need to act like a human.
     *     [/INST]
     *     Ok, I will try my best.
     * </s>
     * Assistant:
     */
    make(
        messages: { role: "system" | "assistant" | "user"; content: string }[],
        delimiter: string = ""
    ): string {
        let prompt = "<s>\n";
        prompt += `\t[INST]\n\t\t${this.systemPrompt}\n\t[/INST]\n\t`;
        prompt += this.assistantPrompt;
        prompt += "\n</s>\n";

        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            prompt += `\t[INST]\n\t\t${message.content}\n\t[/INST]`;

            const nextMessage = messages[++i];
            if (!nextMessage) {
                break;
            }

            prompt += `\n\t${nextMessage.content}`;
            prompt += "\n</s>\n";
        }
        prompt += " Assistant:\n" + delimiter;

        return prompt;
    }

    static processOutput(output: string): string {
        return (output.split("[/INST] Assistant:\n").at(-1) ?? "").trim();
    }
}
