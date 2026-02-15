require("dotenv").config();
const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const axios = require("axios");
const { MongoClient } = require("mongodb");

const app = express();
app.use(express.json());

// File upload setup
const upload = multer({ dest: "uploads/" });

// MongoDB connection string from Atlas
const uri = "your_connection_string_here"; // Replace with your MongoDB Atlas connection string
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    const db = client.db("design_marketplace");
    const designsCollection = db.collection("designs");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

// Call connectDB when starting the server
connectDB();

// Home route
app.get("/", (req, res) => {
  res.send("Design Marketplace Backend Running 🚀");
});

// Upload + Watermark
app.post("/upload", upload.single("design"), async (req, res) => {
  const filePath = req.file.path;
  const previewPath = "preview-" + Date.now() + ".png";

  await sharp(filePath)
    .composite([
      {
        input: Buffer.from(
          `<svg>
            <text x="50%" y="50%" font-size="40" fill="red" text-anchor="middle">
              WATERMARK
            </text>
          </svg>`
        ),
        gravity: "center"
      }
    ])
    .toFile(previewPath);

  res.json({
    message: "Uploaded with watermark",
    preview: previewPath
  });
});

// Paystack Initialize
app.post("/pay", async (req, res) => {
  const { email, amount } = req.body;

  const response = await axios.post(
    "https://api.paystack.co/transaction/initialize",
    {
      email,
      amount: amount * 100
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`
      }
    }
  );

  res.json(response.data);
});

// Verify Payment
app.get("/verify/:reference", async (req, res) => {
  const reference = req.params.reference;

  const response = await axios.get(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`
      }
    }
  );

  if (response.data.data.status === "success") {
    const total = response.data.data.amount / 100;

    const yourCommission = total * 0.2;
    const designerShare = total * 0.8;

    res.json({
      total,
      yourCommission,
      designerShare
    });
  } else {
    res.json({ message: "Payment failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});
