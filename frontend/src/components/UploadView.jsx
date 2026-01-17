import axios from "axios";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

function UploadView({ onComplete, onError }) {
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Preparing analysis...");

  useEffect(() => {
    processFile();
  }, []);

  const processFile = async () => {
    try {
      setLoadingMessage("Reading your bank statement...");
      setProgress(20);
      await sleep(800);

      const fileContent = sessionStorage.getItem("fileContent");
      const fileMetadata = JSON.parse(sessionStorage.getItem("selectedFile"));

      if (!fileContent) {
        throw new Error("No file content found");
      }

      setLoadingMessage("Scanning transactions...");
      setProgress(40);
      await sleep(600);

      const blob = new Blob([fileContent], { type: "text/csv" });
      const formData = new FormData();
      formData.append("file", blob, fileMetadata.name);

      setLoadingMessage("Detecting subscription patterns...");
      setProgress(60);

      const response = await axios.post(
        "http://localhost:5001/api/analyze",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setLoadingMessage("Generating insights...");
      setProgress(80);
      await sleep(800);

      setProgress(100);
      setLoadingMessage("Analysis complete!");
      await sleep(500);

      sessionStorage.removeItem("fileContent");
      sessionStorage.removeItem("selectedFile");

      onComplete(response.data.data);
    } catch (error) {
      console.error("Processing error:", error);
      sessionStorage.removeItem("fileContent");
      sessionStorage.removeItem("selectedFile");
      onError(error.response?.data?.message || error.message);
    }
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center relative overflow-hidden"
    >
      {/* Background animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/3 left-1/3 w-96 h-96 bg-gradient-to-br from-blue-200/40 to-indigo-200/40 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-12 max-w-md w-full border border-gray-200/50 shadow-2xl"
      >
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-6 shadow-lg"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {loadingMessage}
          </h2>
          <p className="text-gray-600">AI is analyzing your subscriptions</p>
        </div>

        {/* Progress bar */}
        <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-white/40 to-transparent rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-center text-sm font-medium text-gray-700">
          {progress}%
        </p>
      </motion.div>
    </motion.div>
  );
}

export default UploadView;
