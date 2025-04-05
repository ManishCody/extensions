const API_BASE_URL = "http://localhost:5000/api/users";

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(["uuid", "hasSeenLoginSignup", "statusEnabled"], async (data) => {
        if (!data.uuid) {
            try {
                const { ip } = await fetch("https://api64.ipify.org?format=json").then((res) => res.json());
                const response = await fetch(`${API_BASE_URL}/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userAgent: navigator.userAgent, ip }),
                }).then((res) => res.json());

                chrome.storage.local.set({ uuid: response.uuid, hasSeenLoginSignup: false, statusEnabled: true });
                console.log("UUID Stored:", response.uuid, "Initial status set to true.");
            } catch (error) {
                console.error("Error during user registration:", error);
            }
        } else if (data.statusEnabled === undefined) {
            chrome.storage.local.set({ statusEnabled: true }, () => console.log("Initial status set to true."));
        }
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "BLOCK_USER") {
        blockUser(message, sendResponse);
        return true;
    }

    if (message.action === "TOGGLE_STATUS") {
        toggleStatus(message);
    }
});

const blockUser = async ({ uuid, username }, sendResponse) => {
    try {
        const response = await fetch(`${API_BASE_URL}/block-user`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uuid, blockUsername: username }),
        }).then((res) => res.json());

        console.log(`Blocked user: ${username}`);
        sendResponse({ success: true, message: response.message });
    } catch (error) {
        console.error("Block user error:", error);
        sendResponse({ success: false, message: error.message });
    }
};

const toggleStatus = ({ statusEnabled }) => {
    chrome.storage.local.set({ statusEnabled }, () => {
        console.log("Status updated:", statusEnabled);

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "UPDATE_STATUS", statusEnabled });
            }
        });
    });
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "UPDATE_STATUS") {
        // Handle status update
        console.log("Received status:", message.statusEnabled);
        sendResponse({ received: true }); // Must respond
        return true; // IMPORTANT: keeps message channel open
    }
});
