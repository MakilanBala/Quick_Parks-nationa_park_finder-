require("dotenv").config(); 

const PORT = process.env.PORT || 4000; // Use PORT from .env or default to 4000
const express = require("express"); 
const cors = require("cors");
const mongoose = require("mongoose");

const { router: authRouter } = require("./routes/auth"); 
const userRouter = require("./routes/user");
const savedParksRouter = require("./routes/savedParks");

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/savedParks", savedParksRouter);

// NPS proxy (GET only)
app.use("/api/nps", async (req, res) => {
  try {
    if (req.method !== "GET") return res.status(405).json({ message: "Method not allowed" });
    const key = process.env.NPS_API_KEY;
    if (!key) return res.status(500).json({ message: "NPS_API_KEY not configured" });

    // Preserve the original query (don’t rebuild with URLSearchParams)
    const upstreamUrl = `https://developer.nps.gov${req.originalUrl.replace(/^\/api\/nps/, "/api/v1")}`;
    console.log("[nps proxy] ->", upstreamUrl);

    const upstream = await fetch(upstreamUrl, { headers: { "X-Api-Key": key } });
    const contentType = upstream.headers.get("content-type") || "application/json";
    const body = await upstream.text();
    res.status(upstream.status).set("Content-Type", contentType).send(body);
  } catch (e) {
    console.error("[nps proxy] error:", e?.message || e);
    res.status(502).json({ message: "Upstream error" });
  }
});

// server/server.js
console.log('NODE_ENV =', process.env.NODE_ENV); // 'development' | 'production' | 'test'


mongoose
  .connect(process.env.MONGO_URI) 
  .then(() => {
    console.log("Mongo connected");
    app.listen(PORT,"0.0.0.0" , () => console.log(`Server running on http://localhost:${PORT}`)); 
  })
  .catch(err => {
    console.error("DB connection failed", err); 
  });