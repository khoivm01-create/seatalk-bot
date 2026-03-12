require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const axios = require("axios");

const app = express();
app.use(express.json());

/* ===============================
   DATABASE CONNECTION (NEON)
================================ */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});


/* ===============================
   TEST API
================================ */
app.get("/", (req, res) => {
  res.send("Seatalk Bot API is running 🚀");
});


/* ===============================
   API IMPORT TỒN KHO TỪ GG SHEET
================================ */
app.post("/import/tonkho", async (req, res) => {

  try {

    const apiKey = req.headers["x-api-key"];

    if (apiKey !== process.env.IMPORT_API_KEY) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const data = req.body.data;

    if (!data || data.length === 0) {
      return res.json({ success: false, message: "No data" });
    }

    for (let item of data) {

      await pool.query(
        `INSERT INTO ton_kho 
        (id, ma_san_pham, ten_san_pham, so_serial, loai_serial,
         ten_nganh_hang, ten_nhom_san_pham, zone, ma_bin, ngay)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (id) DO NOTHING`,
        [
          item.ID,
          item["Mã sản phẩm"],
          item["Tên sản phẩm"],
          item["Số Serial"],
          item["Loại Serial"],
          item["Tên ngành hàng"],
          item["Tên nhóm sản phẩm"],
          item["Zone"],
          item["Mã Bin"],
          item["Ngày"]
        ]
      );

    }

    res.json({
      success: true,
      total: data.length
    });

  } catch (error) {

    console.error("Import error:", error);
    res.status(500).json({
      error: "Insert failed"
    });

  }

});


/* ===============================
   SEATALK WEBHOOK
================================ */
app.post("/webhook/seatalk", async (req, res) => {

  console.log("Seatalk webhook:", JSON.stringify(req.body));

  try {

    /* ===============================
       1️⃣ VERIFY CALLBACK
    ============================== */
    if (req.body.event_type === "event_verification") {

      return res.json({
        seatalk_challenge: req.body.event.seatalk_challenge
      });

    }


    /* ===============================
       2️⃣ NHẬN MESSAGE
    ============================== */

    const message =
      req.body?.event?.message?.text ||
      req.body?.message?.text;

    const chatId =
      req.body?.event?.message?.chat_id ||
      req.body?.message?.chat_id;

    if (!message) return res.sendStatus(200);


    /* ===============================
       3️⃣ QUERY DATABASE
    ============================== */

    const result = await pool.query(
      `SELECT *
       FROM ton_kho
       WHERE ma_san_pham ILIKE $1
       OR so_serial ILIKE $1
       LIMIT 10`,
      [message]
    );


    let reply = "❌ Không tìm thấy dữ liệu.";

    if (result.rows.length > 0) {

      reply = result.rows.map(r =>

`📦 ${r.ten_san_pham}
Serial: ${r.so_serial}
Bin: ${r.ma_bin}
Zone: ${r.zone}`

      ).join("\n\n");

    }


    /* ===============================
       4️⃣ GỬI TIN NHẮN VỀ SEATALK
    ============================== */

    await axios.post(
      "https://openapi.seatalk.io/v2/messages",
      {
        chat_id: chatId,
        text: reply
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SEATALK_APP_ID}`,
          "Content-Type": "application/json"
        }
      }
    );


    res.sendStatus(200);

  } catch (error) {

    console.error("Webhook error:",
      error.response?.data || error.message
    );

    res.sendStatus(200);

  }

});


/* ===============================
   START SERVER
================================ */
app.listen(process.env.PORT || 10000, () => {

  console.log(
    "Server running on port",
    process.env.PORT || 10000
  );

});