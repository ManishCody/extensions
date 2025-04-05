const ICON_ID = "copy-instructions-icon";
const MENU_ID = "copy-instructions-menu";
let lastUrl = location.href;

const addFloatingIcon = () => {
    if (!window.location.href.startsWith("https://www.linkedin.com/feed/")) return;

    chrome.storage.local.get(["statusEnabled", "hideInstructions"], (result) => {
        if (chrome.runtime.lastError) {
            console.error("Storage get error:", chrome.runtime.lastError.message);
            return;
        }

        const { statusEnabled, hideInstructions } = result;
        if (!statusEnabled || hideInstructions) {
            removeFloatingIcon();
            return;
        }

        if (document.getElementById(ICON_ID)) return;

        const icon = document.createElement("div");
        icon.id = ICON_ID;
        icon.innerText = "ℹ️";
        Object.assign(icon.style, {
            position: "fixed",
            left: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            backgroundColor: "#0073b1",
            color: "white",
            padding: "10px",
            borderRadius: "50%",
            cursor: "pointer",
            fontSize: "16px",
            zIndex: "1000",
            boxShadow: "0 2px 5px rgba(0, 0, 0, 0.3)",
        });

        icon.addEventListener("click", toggleMenu);
        document.body.appendChild(icon);
    });

};

const removeFloatingIcon = () => {
    document.getElementById(ICON_ID)?.remove();
};

const toggleMenu = () => {
    const existingMenu = document.getElementById(MENU_ID);
    if (existingMenu) {
        existingMenu.remove();
        return;
    }

    const menu = document.createElement("div");
    menu.id = MENU_ID;
    menu.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; text-align: center; font-size: 14px; padding: 15px;">
            <strong style="font-size: 16px; color: #333;">How to Block a Post:</strong>
            <ol style="margin: 15px 0; padding-left: 0; text-align: left; list-style: none;">
                <li>1) <strong>Click the three dots</strong> on the post.</li>
                <li>2) <strong>Copy the post link</strong> from the menu.</li>
                <li>3) <strong>Open the extension</strong> and select "Report Post".</li>
                <li>4) <strong>Paste the link</strong> and click "Block".</li>
            </ol>
            <button id="hide-instructions-btn" style="
                background-color: #d9534f; 
                color: white; 
                padding: 8px 15px; 
                border: none; 
                border-radius: 6px; 
                cursor: pointer; 
                font-weight: bold;
                transition: background 0.2s;">
                Don't Show Again
            </button>
        </div>
    `;

    Object.assign(menu.style, {
        position: "fixed",
        left: "50px",
        top: "50%",
        transform: "translateY(-50%)",
        backgroundColor: "#fff",
        color: "#333",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
        zIndex: "1001",
        maxWidth: "280px",
        fontFamily: "Arial, sans-serif",
        animation: "fadeIn 0.3s ease-in-out",
    });

    document.body.appendChild(menu);

    document.getElementById("hide-instructions-btn")?.addEventListener("click", () => {
        chrome.storage.local.set({ hideInstructions: true }, () => {
            if (chrome.runtime.lastError) {
                console.error("Storage set error:", chrome.runtime.lastError.message);
                return;
            }
            menu.remove();
            removeFloatingIcon();
        });
    });
};

// Observe DOM changes to re-add the floating icon when necessary
const observer = new MutationObserver(() => {
    chrome.storage.local.get(["statusEnabled", "hideInstructions"], (result) => {
        if (chrome.runtime.lastError) {
            console.error("MutationObserver storage error:", chrome.runtime.lastError.message);
            return;
        }

        if (result.statusEnabled && !result.hideInstructions) {
            addFloatingIcon();
        } else {
            removeFloatingIcon();
        }
    });
});

observer.observe(document.body, { childList: true, subtree: true });

// Listen for storage changes to toggle the floating icon dynamically
chrome.storage.onChanged.addListener((changes) => {
    if (changes.statusEnabled || changes.hideInstructions) {
        chrome.storage.local.get(["statusEnabled", "hideInstructions"], (result) => {
            if (result.statusEnabled && !result.hideInstructions) {
                addFloatingIcon();
            } else {
                removeFloatingIcon();
            }
        });
    }
});

// Watch for URL changes to make sure the icon is always visible
const watchUrlChange = () => {
    setInterval(() => {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            console.log("URL changed to:", currentUrl);

            chrome.storage.local.get(["statusEnabled", "hideInstructions"], (result) => {
                if (chrome.runtime.lastError) {
                    console.error("Error fetching storage:", chrome.runtime.lastError.message);
                    return;
                }

                if (result.statusEnabled && !result.hideInstructions) {
                    addFloatingIcon();
                } else {
                    removeFloatingIcon();
                }
            });
        }
    }, 1000);
};

watchUrlChange();
addFloatingIcon();
