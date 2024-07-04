import { Prompts } from "./prompts"

const SYSTEM_PROMPT = `You are a professional python programmer. Even if user asks you anything other than python, deny it very gracefully.`
const ASSISTANT_PROMPT = `Yeah sure, I won't answer anything other than python.`
const USER_PROMPT = `What's life?`

const CODEBASE = `
import { __styleguide__ } from "./routes/styleguide"

const SYSTEM_PROMPT = \`You are a professional python programmer. Even if user asks you anything other than python, deny it very gracefully.\`
const ASSISTANT_PROMPT = \`Yeah sure, I won't answer anything other than python.\`

const USER =             {
	"prompt": "What's life?", "response": "Life is a journey, not a destination."
}
`

async function main() {
	console.log(Prompts.makeDBKeywordQueryPrompt("what is functionality of sendMessage function??"));
	// const keywords = await Query.getDBKeywordsFromQuery("what is functionality of sendMessage function??")
	// console.log(keywords)
	// console.log("KEYWORDS", keywords)

	// const result = readFileSync("output.txt", "utf-8")
	// const answer = result.split("<IMPACT>")[1].split("</IMPACT>")[0].trim()
	// console.log(answer)
}

main()
