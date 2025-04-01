const hideFakePosts = () => {
    const posts = document.querySelectorAll(".feed-shared-update-card");
  
    posts.forEach(post => {
      const text = post.textContent || "";
      if (text.includes("fake") || text.includes("scam")) {
        (post).style.display = "none";
      }
    });
  };
  
  // Run every 2 seconds to detect new posts dynamically
  setInterval(hideFakePosts, 2000);
  