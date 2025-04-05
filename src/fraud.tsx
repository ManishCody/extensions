import { useState, useEffect } from "react";
import { Circle, AlertTriangle, User, ChevronRight, EyeOffIcon } from "lucide-react";

interface FraudDetectionProps {
    onNavigateToBlockedUsers: () => void;
}

export default function FraudDetection({ onNavigateToBlockedUsers }: FraudDetectionProps) {
    const [statusEnabled, setStatusEnabled] = useState(true);
    const [hideFakePosts, setHideFakePosts] = useState(true);
    const [hideSuspiciousPosts, setHideSuspiciousPosts] = useState(true);

    useEffect(() => {
        chrome.storage.local.get(["statusEnabled"], (data) => {
            if (data.statusEnabled !== undefined) {
                setStatusEnabled(data.statusEnabled);
            }
        });
    }, []);

    const toggleStatus = () => {
        const newStatus = !statusEnabled;
        setStatusEnabled(newStatus);
    
        chrome.storage.local.set({ statusEnabled: newStatus }, () => {
            chrome.runtime.sendMessage({ action: "UPDATE_STATUS", statusEnabled: newStatus }, () => {
                console.log("Extension status changed:", newStatus);
            });
        });
    };
    
    return (
        <div className="fraud-detection-container">
            <div className="logo-section">
                <div className="logo" onClick={toggleStatus}>
                    <img
                        src="/main-logo.png"
                        className="logo"
                        alt=""
                        style={{ filter: statusEnabled ? "none" : "grayscale(1)" }}
                    />
                </div>
            </div>
            <div className="content-section">
                <h1 className="title">Dehix fraud detector</h1>

                <div className="toggle-list">
                    <div className="toggle-item">
                        <div className="toggle-label">
                            <Circle className="toggle-icon status-icon" />
                            <span>Status</span>
                        </div>
                        <label className="switch">
                            <input type="checkbox" checked={statusEnabled} onChange={toggleStatus} />
                            <span className="slider"></span>
                        </label>
                    </div>

                    <div className="toggle-item">
                        <div className="toggle-label">
                            <EyeOffIcon className="toggle-icon shield-icon" />
                            <span>Hide fake posts</span>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={hideFakePosts}
                                onChange={() => setHideFakePosts(!hideFakePosts)}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>

                    <div className="toggle-item">
                        <div className="toggle-label">
                            <AlertTriangle className="toggle-icon alert-icon" />
                            <span>Hide suspicious posts</span>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={hideSuspiciousPosts}
                                onChange={() => setHideSuspiciousPosts(!hideSuspiciousPosts)}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>
                </div>

                <div className="button-group">
                    <button className="action-button">View activity</button>
                    <button className="action-button">Visit the Dehix</button>
                </div>

                <button className="manage-users-button" onClick={onNavigateToBlockedUsers}>
                    <div className="manage-users-label">
                        <User className="user-icon" />
                        <span>Blocked Post</span>
                    </div>
                    <ChevronRight className="chevron-icon" />
                </button>
            </div>
        </div>
    );
}