import { useState, useEffect } from "react";
import FraudDetection from "./fraud";
import BlockedUsers from "./block";
import "./style.css";
import LoginContainer from "./login";

export default function Home() {
  const [currentPage, setCurrentPage] = useState<"fraud-detection" | "blocked-users">("fraud-detection");
  const [showLoginSignup, setShowLoginSignup] = useState<boolean>(false);
  const [uuid, setUuid] = useState<string | null>(null); 

  useEffect(() => {
    chrome.storage.local.get(["hasSeenLoginSignup"], (data) => {
      setShowLoginSignup(data.hasSeenLoginSignup === false);
    });

    chrome.storage.local.get(["uuid"], (data) => {
      if (data.uuid) {
        setUuid(data.uuid);
      }
    });
  }, []);

  return (
    <main className="app-container">
      <div className="app-card">
        {showLoginSignup ? (
          <LoginContainer setShowLoginSignup={setShowLoginSignup} />
        ) : currentPage === "fraud-detection" ? (
          <FraudDetection
            onNavigateToBlockedUsers={() => setCurrentPage("blocked-users")}
           
          />
        ) : (
          <BlockedUsers onNavigateBack={() => setCurrentPage("fraud-detection")} uuid={uuid || ""}  />
        )}
      </div>
    </main>
  );
}