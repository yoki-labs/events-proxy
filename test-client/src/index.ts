import express from "express";
const app = express();
const PORT = process.env.TEST_PORT ?? 2224;

app.use(express.json());
app.post("/interactions", (req, res) => {
    console.log(req.body);
    return res.status(200).json({ message: "received" });
});
app.listen(PORT, () => console.log(`Test server live on :${PORT}`));
