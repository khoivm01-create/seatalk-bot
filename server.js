require("dotenv").config();
const express = require("express");

const app = express();
app.use(express.json());

// ===============================
// TEST API
// ===============================
app.get("/", (req, res) => {
  res.send("Seatalk Bot API is running 🚀");
});

// ===============================
// WEBHOOK SEATALK
// ===============================
app.post("/webhook/seatalk", (req, res) => {

  console.log("Seatalk webhook body:", req.body);

  // 🔹 Seatalk URL Verification
  if (req.body.challenge) {
    return res.status(200).json({
      challenge: req.body.challenge
    });
  }

  res.sendStatus(200);
});

app.listen(process.env.PORT || 10000, () => {
  console.log("Server running on port", process.env.PORT || 10000);
});