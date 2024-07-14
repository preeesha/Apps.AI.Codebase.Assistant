import { configDotenv } from "dotenv"
configDotenv()

export const NEO4J_URI = process.env["NEO4J_URI"] ?? ""
