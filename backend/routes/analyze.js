import express from "express";
import multer from "multer";
import { enhanceWithAI } from "../services/aiService.js";
import { parseCSV } from "../services/csvParser.js";
import { detectSubscriptions } from "../services/subscriptionDetector.js";

const router = express.Router();

// Configure multer for memory storage (no disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  },
});

// POST /api/analyze - Main analysis endpoint
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Step 1: Parse CSV
    const csvText = req.file.buffer.toString("utf-8");
    const transactions = parseCSV(csvText);

    if (transactions.length === 0) {
      return res
        .status(400)
        .json({ error: "No valid transactions found in CSV" });
    }

    // Step 2: Detect subscription patterns (deterministic logic)
    const subscriptions = detectSubscriptions(transactions);

    // Step 3: Enhance with AI (merchant names, insights)
    const analysis = await enhanceWithAI(subscriptions);

    // Return analysis results
    res.json({
      success: true,
      data: analysis,
      metadata: {
        totalTransactions: transactions.length,
        subscriptionsFound: subscriptions.length,
        processedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({
      error: "Analysis failed",
      message: error.message,
    });
  }
});

export default router;
