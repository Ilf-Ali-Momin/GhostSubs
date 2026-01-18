import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import analyzeRouter from "./routes/analyze.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS Configuration - Allow frontend requests
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      /\.vercel\.app$/  // Allows ALL Vercel deployments
    ];
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Routes
app.use("/api/analyze", analyzeRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "GhostSubs API is running" });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({ message: "GhostSubs API", status: "running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 GhostSubs API running on http://localhost:${PORT}`);
  console.log(`📊 Ready to analyze subscriptions!`);
});
