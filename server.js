require("dotenv").config();
const express = require("express");

const app = express();
app.use(express.json());

// TEST
app.get("/", (req, res) => {
  res.send("Seatalk Bot API is running 🚀");
});

// WEBHOOK
app.post("/webhook/seatalk", (req, res) => {

  console.log("Seatalk webhook body:", req.body);

  // Seatalk verification
  if (req.body.event_type === "event_verification") {
    return res.status(200).json({
      seatalk_challenge: req.body.event.seatalk_challenge
    });
  }

  res.sendStatus(200);
});

app.listen(process.env.PORT || 10000, () => {
  console.log("Server running on port", process.env.PORT || 10000);
});