const addReportButtons = () => {
    if (!window.location.href.startsWith("https://www.linkedin.com/feed/")) return;

    chrome.storage.local.get(["statusEnabled"], ({ statusEnabled }) => {
        if (!statusEnabled) {
            removeReportButtons();
            return;
        }

        document.querySelectorAll("div.feed-shared-update-v2, div.update-components-text-view").forEach((post) => {
            if (post.dataset.processed) return;

            const profileLink = post.querySelector("a[href*='/in/']");
            if (!profileLink) return;

            const reportBtn = createReportButton(profileLink);
            post.style.position = "relative";
            post.appendChild(reportBtn);
            post.dataset.processed = "true";
        });
    });
};

const createReportButton = (profileLink) => {
    const reportBtn = document.createElement("button");
    reportBtn.innerText = "⚠️ Report";
    reportBtn.className = "dehix-report-btn";
    
    Object.assign(reportBtn.style, {
        position: "absolute",
        top: "10px",
        right: "10px",
        backgroundColor: "#ff4d4d",
        color: "white",
        border: "none",
        padding: "5px 10px",
        borderRadius: "5px",
        cursor: "pointer",
        fontSize: "12px",
        zIndex: "1000",
    });

    reportBtn.addEventListener("click", () => reportUser(profileLink));

    return reportBtn;
};

const reportUser = (profileLink) => {
    try {
        const url = new URL(profileLink.href);
        const username = url.pathname.split("/in/")[1]?.split("/")[0]?.split("?")[0];

        if (!username) return;

        chrome.storage.local.get(["uuid"], ({ uuid }) => {
            chrome.runtime.sendMessage({ action: "BLOCK_USER", uuid, username }, (response) => {
                alert(response?.success ? `${username} has been reported!` : `Failed to report ${username}: ${response?.message}`);
            });
        });
    } catch (error) {
        console.error("Error parsing profile link:", error);
    }
};

const removeReportButtons = () => {
    document.querySelectorAll(".dehix-report-btn").forEach((btn) => btn.remove());
};

// Observe changes to dynamically load buttons
const observer = new MutationObserver(addReportButtons);
observer.observe(document.body, { childList: true, subtree: true });

// Listen for messages to toggle status
chrome.runtime.onMessage.addListener(({ action, statusEnabled }) => {
    if (action === "UPDATE_STATUS") {
        statusEnabled ? addReportButtons() : removeReportButtons();
    }
});

// Initialize
addReportButtons();
