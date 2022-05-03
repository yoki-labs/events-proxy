import express from "express";
import { AUTHORIZATION, LISTENER_PORT } from "./configs";
import { spawnGateway } from "./gateway";

// HTTP LISTENER
const app = express();

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(express.json());

app.post("/spawn", async (req, res) => {
  handleRequest(req, res);
});

app.post("/shutdown", async (req, res) => {
  // TODO: Shutdown some bot
});

async function handleRequest(req, res) {
  if (!AUTHORIZATION || AUTHORIZATION !== req.headers.authorization) {
    return res.status(401).json({ error: "Invalid authorization key." });
  }

  if (!req.body.options) {
    return res.status(401).json({ error: "You did not provide any options." });
  }

  // TODO: VALIDATION CHECKS LIKE TOKEN AND SUCH

  try {
    const result = spawnGateway(req.body.options);

    if (result) {
      res.status(200).json({ success: true });
    } else {
      res.status(204).json();
    }
  } catch (error: any) {
    if (error?.code) res.status(500).json(error);
    else
      res.status(500).json({
        error: error.message ?? "No error found at all what the hell skillz.",
      });
  }
}

app.listen(LISTENER_PORT, () => {
  console.log(`REST listening at http://localhost:${LISTENER_PORT}`);
});
