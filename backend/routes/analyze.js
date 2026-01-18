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
    const allowedTypes = [
      "text/csv",
      "application/pdf",
      "application/vnd.ms-excel",
    ];
    const allowedExtensions = [".csv", ".pdf"];

    const isAllowedType = allowedTypes.includes(file.mimetype);
    const isAllowedExt = allowedExtensions.some((ext) =>
      file.originalname.toLowerCase().endsWith(ext),
    );

    if (isAllowedType || isAllowedExt) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV and PDF files are allowed"));
    }
  },
});

// POST /api/analyze - Main analysis endpoint
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log(
      `📁 Processing file: ${req.file.originalname} (${req.file.mimetype})`,
    );

    let transactions;

    // Check file type and parse accordingly
    if (
      req.file.mimetype === "application/pdf" ||
      req.file.originalname.toLowerCase().endsWith(".pdf")
    ) {
      // Parse PDF
      const { extractTextFromPDF, parseTransactionsFromPDF } =
        await import("../services/pdfParser.js");

      console.log("📄 Extracting text from PDF...");
      const pdfText = await extractTextFromPDF(req.file.buffer);

      console.log("📊 Parsing transactions from PDF text...");
      transactions = parseTransactionsFromPDF(pdfText);
    } else {
      // Parse CSV
      const csvText = req.file.buffer.toString("utf-8");
      transactions = parseCSV(csvText);
    }

    if (transactions.length === 0) {
      return res.status(400).json({
        error: "No valid transactions found",
        suggestion:
          "Make sure your file contains transaction data with dates, descriptions, and amounts",
      });
    }

    console.log(`✅ Found ${transactions.length} transactions`);

    // Detect subscription patterns (same for both CSV and PDF)
    const subscriptions = detectSubscriptions(transactions);

    console.log(`🔍 Detected ${subscriptions.length} subscriptions`);

    // Enhance with AI
    const analysis = await enhanceWithAI(subscriptions);

    // Return analysis results
    res.json({
      success: true,
      data: analysis,
      metadata: {
        fileType: req.file.mimetype,
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
      suggestion: "Please check your file format and try again",
    });
  }
});

export default router;
