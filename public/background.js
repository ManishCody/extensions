chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(["uuid", "hasSeenLoginSignup"], (data) => {
        if (!data.uuid) {
            fetch("https://api64.ipify.org?format=json")
                .then((res) => res.json())
                .then((data) => {
                    const systemIdentifier = `${navigator.userAgent}-${data.ip}`;
                    fetch("http://localhost:5000/api/users/register", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userAgent: navigator.userAgent, ip: data.ip }),
                    })
                        .then((res) => res.json())
                        .then((response) => {
                            chrome.storage.local.set({ 
                                uuid: response.uuid,
                                hasSeenLoginSignup: false, // Set flag to false on first run
                            });
                            console.log("UUID Stored:", response.uuid);
                        })
                        .catch((err) => console.error(" Error registering user:", err));
                });
        }
    });
});
