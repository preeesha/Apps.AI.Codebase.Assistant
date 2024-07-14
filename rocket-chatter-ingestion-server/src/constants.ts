import { configDotenv } from "dotenv"
configDotenv()

export const RC_APP_URI = process.env["RC_APP_URI"] ?? ""
