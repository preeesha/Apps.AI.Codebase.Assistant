import { IHttp } from "@rocket.chat/apps-engine/definition/accessors";

export async function renderDiagramToBase64URI(
    http: IHttp,
    source: string
): Promise<string> {
    source = source.trim();

    let svgContent = "";
    try {
        const response = await http.post("https://kroki.io", {
            headers: {
                Accept: "image/svg+xml",
                "Content-Type": "text/json",
            },
            content: JSON.stringify({
                diagram_source: source,
                diagram_type: "mermaid",
                output_format: "svg",
            }),
        });
        svgContent = response.content as string;
    } catch (error) {
        console.error("Error while rendering diagram", error);
        return "";
    }

    console.log(svgContent);

    const svgContentBase64 = Buffer.from(svgContent).toString("base64");
    const uri = `data:image/svg+xml;base64,${svgContentBase64}`;
    return uri;
}
