require("dotenv").config(); 

const express = require("express"); 
const cors = require("cors");
const mongoose = require("mongoose");

const { router: authRouter } = require("./routes/auth"); 
const userRouter = require("./routes/user");
const savedParksRouter = require("./routes/savedParks");

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/savedParks", savedParksRouter);

mongoose
  .connect(process.env.MONGO_URI) 
  .then(() => {
    console.log("Mongo connected");
    app.listen(4000, () => console.log("Server running on http://localhost:4000")); 
  })
  .catch(err => {
    console.error("DB connection failed", err); 
  });