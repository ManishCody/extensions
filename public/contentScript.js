(() => {
    const API_BASE_URL = "http://localhost:5000/api/users";
    const ICON_ID = "copy-instructions-icon";
    const MENU_ID = "copy-instructions-menu";
    let lastProcessedUrl = location.href;
  
    const extractPostId = (url) => {
      const match = url.match(/activity-(\d+)/);
      return match ? match[1] : null;
    };
  
    const getBlockedPostIds = () => {
      return new Promise((resolve) => {
        chrome.storage.local.get(["reportedPosts", "uuid"], async ({ reportedPosts = [], uuid }) => {
          if (uuid) {
            try {
              const res = await fetch(`${API_BASE_URL}/blocked-users/${uuid}`);
              const data = await res.json();
              const apiIds = (data?.blockedUsers || []).map((u) => u.postId);
              resolve(new Set([...reportedPosts, ...apiIds]));
            } catch (e) {
              console.warn("Could not fetch from API:", e);
              resolve(new Set(reportedPosts));
            }
          } else {
            resolve(new Set(reportedPosts));
          }
        });
      });
    };
  
    const hideMatchedPosts = async () => {
      const postIdSet = await getBlockedPostIds();
      const posts = document.querySelectorAll(".feed-shared-update, .feed-shared-update-v2");
  
      posts.forEach((post) => {
        const link = post.querySelector('a[href*="/posts/"]');
        if (link) {
          const postId = extractPostId(link.href);
          if (postId && postIdSet.has(postId)) {
            post.style.display = "none";
            post.classList.add("reported-hidden");
            console.log("Post hidden:", postId);
          }
        }
      });
    };
  
    const startPostObserver = () => {
      const feed = document.querySelector(".scaffold-finite-scroll__content");
      if (!feed) return;
  
      const observer = new MutationObserver(() => {
        hideMatchedPosts();
      });
  
      observer.observe(feed, { childList: true, subtree: true });
      hideMatchedPosts();
    };
  
    const watchUrlChange = () => {
      setInterval(() => {
        const currentUrl = location.href;
        if (currentUrl !== lastProcessedUrl) {
          lastProcessedUrl = currentUrl;
          hideMatchedPosts();
        }
      }, 1000);
    };
  
    const addFloatingIcon = () => {
      if (document.getElementById(ICON_ID)) return;
  
      chrome.storage.local.get(["statusEnabled", "hideInstructions"], ({ statusEnabled, hideInstructions }) => {
        if (!statusEnabled || hideInstructions) {
          removeFloatingIcon();
          return;
        }
  
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
          boxShadow: "0 2px 5px rgba(0, 0, 0, 0.3)"
        });
  
        icon.addEventListener("click", toggleMenu);
        document.body.appendChild(icon);
      });
    };
  
    const removeFloatingIcon = () => {
      document.getElementById(ICON_ID)?.remove();
    };
  
    const toggleMenu = () => {
      const existing = document.getElementById(MENU_ID);
      if (existing) {
        existing.remove();
        return;
      }
  
      const menu = document.createElement("div");
      menu.id = MENU_ID;
      menu.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;font-size:14px;padding:15px;">
            <strong style="font-size:16px;color:#333;">How to Block a Post:</strong>
            <ol style="margin:15px 0;padding-left:0;text-align:left;list-style:none;">
              <li>1) Click the three dots on the post.</li>
              <li>2) Copy the post link from the menu.</li>
              <li>3) Open the extension and select "Report Post".</li>
              <li>4) Paste the link and click "Block".</li>
            </ol>
            <button id="hide-instructions-btn" style="background:#d9534f;color:white;padding:8px 15px;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">Don't Show Again</button>
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
      });
  
      document.body.appendChild(menu);
  
      document.getElementById("hide-instructions-btn")?.addEventListener("click", () => {
        chrome.storage.local.set({ hideInstructions: true }, () => {
          menu.remove();
          removeFloatingIcon();
        });
      });
    };
  
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "CHECK_AND_BLOCK_POST" && message.postUrl) {
        const postId = extractPostId(message.postUrl);
        if (!postId) {
          sendResponse({ success: false, reason: "Invalid URL" });
          return;
        }
  
        const posts = document.querySelectorAll(".feed-shared-update");
        let foundMatch = false;
  
        posts.forEach((post) => {
          const link = post.querySelector('a[href*="/posts/"]');
          if (link && extractPostId(link.href) === postId) {
            foundMatch = true;
            post.style.display = "none";
            post.classList.add("reported-hidden");
          }
        });
  
        setTimeout(() => {
          sendResponse({ success: foundMatch, reason: foundMatch ? "Blocked" : "Not found on page" });
        }, 500);
  
        return true;
      }
      if (message.action === "RE_EVALUATE_POSTS") {
        hideMatchedPosts();
      }
    });
  
    window.addEventListener("load", () => {
      try {
        startPostObserver();
        watchUrlChange();
        addFloatingIcon();
        hideMatchedPosts();
      } catch (e) {
        console.error("Initialization failed:", e);
      }
    });
  })();
  
  function hideReportedPosts() {
    chrome.storage.local.get({ reportedPosts: [] }, ({ reportedPosts }) => {
      if (!Array.isArray(reportedPosts)) return;
      const allPosts = document.querySelectorAll("div[data-id^='urn:li:activity:']");
  
      allPosts.forEach((post) => {
        const dataId = post.getAttribute("data-id");
        const postId = dataId?.split(":").pop(); 
  
        if (postId && reportedPosts.includes(postId)) {
          post.closest("div[data-id]")?.remove(); 
        }
      });
    });
  }
  
  const observer = new MutationObserver(() => {
    hideReportedPosts();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
  
  hideReportedPosts();