import { useState, useEffect } from "react";
import {
    Circle,
    AlertTriangle,
    EyeOffIcon,
    Settings2,
    ChevronDownIcon,
} from "lucide-react";

interface FraudDetectionProps {
    onNavigateToBlockedUsers: () => void;
}

export default function FraudDetection({ onNavigateToBlockedUsers }: FraudDetectionProps) {
    const [statusEnabled, setStatusEnabled] = useState(true);
    const [hideFakePosts, setHideFakePosts] = useState(true);
    const [hideSuspiciousPosts, setHideSuspiciousPosts] = useState(true);
    const [showAdvanced, setShowAdvanced] = useState(false); // Advanced accordion toggle

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
            chrome.runtime.sendMessage({ action: "UPDATE_STATUS", statusEnabled: newStatus });
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
                            <EyeOffIcon className="toggle-icon" />
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
                            <AlertTriangle className="toggle-icon" />
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
                {/* Advanced Settings Accordion */}
                <div className="accordion-section">
                    <div
                        className="accordion-header"
                        onClick={() => setShowAdvanced((prev) => !prev)}
                    >
                        <div>
                            <Settings2 className="accordion-icon" />
                            <span>Advanced Settings</span>
                        </div>
                        <ChevronDownIcon className="accordion-icon" />
                    </div>
                    {showAdvanced && (
                        <div className="accordion-body">
                            <div className="button-group">
                                <button className="action-button" onClick={onNavigateToBlockedUsers}>Block Post</button>
                                <button className="action-button">Block User</button>
                            </div>
                            <div className="button-group">
                                <button className="action-button">Spam Post</button>
                                <button className="action-button">Spam User</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
