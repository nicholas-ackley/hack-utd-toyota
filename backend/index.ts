import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

app.use(
  cors({
    origin: [/^http:\/\/localhost:\d+$/], // allow all localhost ports
    methods: ["GET", "POST"],
  })
);


app.use(express.json());

const responsesPath = path.join(__dirname, "responses.json");
console.log("📁 Saving responses to:", responsesPath);


if (!fs.existsSync(responsesPath)) {
  fs.writeFileSync(responsesPath, "[]");
}

app.post("/api/save-answers", (req, res) => {
  const data = req.body;
  console.log("📩 Received data:", data);

  if (!data || !data.answers) {
    return res.status(400).json({ message: "Invalid data" });
  }

  const file = JSON.parse(fs.readFileSync(responsesPath, "utf-8"));
  file.push({ ...data, timestamp: Date.now() });

  fs.writeFileSync(responsesPath, JSON.stringify(file, null, 2));

  res.json({ message: "✅ Answers saved successfully" });
});

app.get("/api/responses", (req, res) => {
  const data = JSON.parse(fs.readFileSync(responsesPath, "utf-8"));
  res.json(data);
});
app.get("/favicon.ico", (req, res) => res.status(204));

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
