require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { GoogleGenAI } = require("@google/genai");
const PetState = require("./models/PetState");

const app = express();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

// Middleware
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());

// Ensure a single persistent game state exists
async function getOrCreateState() {
  let state = await PetState.findOne();
  if (!state) {
    state = await PetState.create({});
  }
  return state;
}

// 1. Fetch current global state
app.get("/api/state", async (req, res) => {
  try {
    const state = await getOrCreateState();
    res.json(state);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch state", details: err.message });
  }
});

// 2. Synchronize entire state or update tasks/EXP
app.post("/api/state", async (req, res) => {
  try {
    const state = await getOrCreateState();
    const {
      petName,
      level,
      currentExp,
      expToNext,
      couponsSaved,
      tasks,
      dailyQuestion,
    } = req.body;

    if (petName !== undefined) state.petName = petName;
    if (level !== undefined) state.level = level;
    if (currentExp !== undefined) state.currentExp = currentExp;
    if (expToNext !== undefined) state.expToNext = expToNext;
    if (couponsSaved !== undefined) state.couponsSaved = couponsSaved;
    if (tasks !== undefined) state.tasks = tasks;
    if (dailyQuestion !== undefined) state.dailyQuestion = dailyQuestion;

    await state.save();
    res.json(state);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to update state", details: err.message });
  }
});

// 3. AI Question Generation Endpoint
app.post("/api/questions/generate", async (req, res) => {
  try {
    const { category = "balanced" } = req.body;

    const prompt = `You are a relationship counselor and thoughtful game host for a loving couple.
Generate a single, engaging, open-ended question for them to answer.
Category style: ${category} (options: funny, deep/serious, romantic, intellectual, or everyday life).
Rules:
- Output ONLY the question sentence itself.
- Do not include greetings, introductions, quotation marks, or explanations.
- Make it specific, emotional, and easy to reflect on.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    const questionText = response.text?.trim().replace(/^["']|["']$/g, "");
    if (!questionText) throw new Error("Gemini returned an empty question");

    // Update state directly with the new prompt and reset submission locks
    const state = await getOrCreateState();
    state.dailyQuestion = {
      prompt: questionText,
      revealed: false,
      answers: {
        p1: { text: "", locked: false },
        p2: { text: "", locked: false },
      },
    };
    await state.save();

    res.json({ prompt: questionText });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to generate question", details: err.message });
  }
});

// Connect Database & Start
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });
