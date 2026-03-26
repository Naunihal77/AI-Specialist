import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("Missing GEMINI_API_KEY in environment.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

app.use(cors());
app.use(express.json({ limit: "15mb" }));

app.post("/api/analyze", async (req, res) => {
  try {
    const { imageBuffer, mimeType, prompt } = req.body;

    if (!imageBuffer || !mimeType || !prompt) {
      return res.status(400).json({ error: "imageBuffer, mimeType, and prompt are required." });
    }

    const base64 = imageBuffer.split(",")[1];
    if (!base64) {
      return res.status(400).json({ error: "Invalid imageBuffer format." });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64,
                mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
    });

    console.log("gemini response", JSON.stringify(response));

    let text = "";

    // Old/new response shape handling
    if (response?.candidates?.length) {
      text = response.candidates
        .map((c) => {
          if (Array.isArray(c.content)) {
            return c.content.map((part) => part?.text ?? "").join(" ");
          }
          return "";
        })
        .filter(Boolean)
        .join("\n");
    }

    if (!text && Array.isArray(response?.output)) {
      text = response.output
        .flatMap((item) => {
          if (Array.isArray(item.content)) {
            return item.content.map((part) => part?.text ?? "");
          }
          return [];
        })
        .join(" ");
    }

    if (!text && typeof response?.text === "string") {
      text = response.text;
    }

    if (!text) {
      return res.status(500).json({ error: "No text found in Gemini response. See server log for raw response." });
    }

    return res.json({ text });
  } catch (error) {
    console.error("/api/analyze error", error);
    return res.status(500).json({ error: "Failed to analyze image. " + (error?.message ?? "") });
  }
});

app.use(express.static("dist"));

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
