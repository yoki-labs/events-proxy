import { config } from "dotenv";
import { join } from "path";
import API from "./server";

// Load env variables
config({ path: join(__dirname, "..", ".env") });
const PORT = process.env.SERVER_PORT ?? 80;

// Check ENV variables to ensure we have the necessary things to start the bot up
["SERVER_PORT"].forEach((x) => {
    if (!process.env[x]) throw new Error(`Missing env var ${x}`);
});

process.on("unhandledRejection", console.log);
API.listen(PORT, () => {
    console.log(`REST listening at http://localhost:${PORT}`);
});
