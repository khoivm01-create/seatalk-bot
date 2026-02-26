require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Test API
app.get("/", (req, res) => {
  res.send("Seatalk Bot API is running 🚀");
});


// ===============================
// API IMPORT TỒN KHO TỪ GG SHEET
// ===============================
app.post("/import/tonkho", async (req, res) => {
  try {
    const data = req.body.data;

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

    res.json({ success: true, total: data.length });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Insert failed" });
  }
});


// ===============================
// WEBHOOK SEATALK
// ===============================
app.post("/webhook/seatalk", async (req, res) => {

  const message = req.body.message?.text;
  const chatId = req.body.message?.chat_id;

  if (!message) return res.sendStatus(200);

  // Ví dụ: người dùng nhập mã sản phẩm
  const result = await pool.query(
    "SELECT * FROM ton_kho WHERE ma_san_pham = $1 LIMIT 10",
    [message]
  );

  let reply = "Không tìm thấy dữ liệu.";

  if (result.rows.length > 0) {
    reply = result.rows.map(r =>
      `${r.ten_san_pham}\nSerial: ${r.so_serial}\nBin: ${r.ma_bin}`
    ).join("\n\n");
  }

  // TODO: Gửi reply lại Seatalk bằng Open Platform API

  res.sendStatus(200);
});

app.listen(process.env.PORT, () => {
  console.log("Server running on port", process.env.PORT);
});