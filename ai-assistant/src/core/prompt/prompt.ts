export type PromptRole = "user" | "assistant" | "system";
export type PromptMessage = { role: PromptRole; content: string };
export type PromptMessages = PromptMessage[];

export class Prompt {
    private _messages: PromptMessages = [];
    get messages() {
        return this._messages;
    }
    set messages(messages: PromptMessages) {
        this._messages = messages;
    }

    private parsePromptContent(content: string): string {
        return content
            .split("\n")
            .map((x) => x.trim())
            .join("\n");
    }

    pushSystem(content: string) {
        this._messages.push({
            role: "system",
            content: this.parsePromptContent(content),
        });
    }

    pushAssistant(content: string) {
        this._messages.push({
            role: "assistant",
            content: this.parsePromptContent(content),
        });
    }

    pushUser(content: string) {
        this._messages.push({
            role: "user",
            content: this.parsePromptContent(content),
        });
    }
}
