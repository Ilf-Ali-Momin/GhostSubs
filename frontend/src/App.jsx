import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import Dashboard from "./components/Dashboard";
import LandingPage from "./components/LandingPage";
import UploadView from "./components/UploadView";

function App() {
  const [view, setView] = useState("landing");
  const [analysisData, setAnalysisData] = useState(null);

  const handleFileSelected = (file) => {
    setView("uploading");
  };

  const handleAnalysisComplete = (data) => {
    setAnalysisData(data);
    setView("dashboard");
  };

  const handleAnalysisError = (error) => {
    alert(`Analysis failed: ${error}`);
    setView("landing");
  };

  const handleReset = () => {
    setView("landing");
    setAnalysisData(null);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <AnimatePresence mode="wait">
        {view === "landing" && (
          <LandingPage key="landing" onFileSelected={handleFileSelected} />
        )}
        {view === "uploading" && (
          <UploadView
            key="uploading"
            onComplete={handleAnalysisComplete}
            onError={handleAnalysisError}
          />
        )}
        {view === "dashboard" && analysisData && (
          <Dashboard
            key="dashboard"
            data={analysisData}
            onReset={handleReset}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
