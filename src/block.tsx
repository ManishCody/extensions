import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, User, X, Loader2 } from "lucide-react";
import axios from "axios";

interface BlockedUsersProps {
  onNavigateBack: () => void;
  uuid: string;
}

export default function BlockedUsers({ onNavigateBack, uuid }: BlockedUsersProps) {
  const [username, setUsername] = useState("");
  const [blockedUsers, setBlockedUsers] = useState<
    { postId: string; userName: string; _id: string }[]
  >([]);

  const [loading, setLoading] = useState({ blocking: false, unblocking: null as string | null });
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      try {
        const { data } = await axios.get(
          `http://localhost:5000/api/users/blocked-posts/${uuid}?reportType=spam`
        );
        setBlockedUsers(data.blockedUsers);
      } catch {
        setMessage({ text: "Failed to load blocked users.", type: "error" });
      }
    };
  
    fetchBlockedUsers();
  }, [uuid]);
  

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleBlockUser = useCallback(async () => {
    if (!username.trim()) {
      return setMessage({ text: "Please enter a post link.", type: "error" });
    }
  
    const postUrl = username.trim();
  
    const postIdMatch = postUrl.match(/activity-(\d+)-/);
    const postId = postIdMatch ? postIdMatch[1] : null;
  
    const userMatch = postUrl.match(/linkedin\.com\/posts\/([^_]+)/);
    const extractedUserName = userMatch ? userMatch[1] : null;
  
    if (!postId || !extractedUserName) {
      return setMessage({ text: "Invalid LinkedIn post URL.", type: "error" });
    }
  
    setLoading((prev) => ({ ...prev, blocking: true }));
  
    try {
      const { data } = await axios.post("http://localhost:5000/api/users/block-post", {
        uuid,
        postId,
        reportType: "spam",
        userName: extractedUserName,
        postUrl,
      });
  
      chrome.storage?.local.get({ reportedPosts: [] }, ({ reportedPosts }) => {
        const updated = [...new Set([...reportedPosts, postId])];
        chrome.storage.local.set({ reportedPosts: updated }, () => {
          chrome.runtime.sendMessage({ action: "RE_EVALUATE_POSTS" });
        });
      });
  
      setBlockedUsers((prev) => [
        ...prev,
        { postId, userName: extractedUserName, _id: data.reportId },
      ]);
      setMessage({ text: data.message, type: "success" });
      setUsername("");
    } catch (error: any) {
      setMessage({
        text: error.response?.data?.error || "Failed to report post.",
        type: "error",
      });
    } finally {
      setLoading((prev) => ({ ...prev, blocking: false }));
    }
  }, [username, uuid]);
  

  const handleRemoveUser = useCallback(async (postId: string) => {
    setLoading((prev) => ({ ...prev, unblocking: postId }));
  
    try {
      await axios.delete(
        `http://localhost:5000/api/users/block-post/${uuid}/${postId}?reportType=spam`
      );
  
      setBlockedUsers((prev) => prev.filter((user) => user.postId !== postId));
      setMessage({ text: "User unblocked successfully.", type: "success" });
    } catch (error: any) {
      setMessage({
        text: error.response?.data?.error || "Failed to unblock user.",
        type: "error",
      });
    } finally {
      setLoading((prev) => ({ ...prev, unblocking: null }));
    }
  }, [uuid]);
  
  

  return (
    <div className="blocked-users-container">
      <div className="blocked-users-header">
        <button className="back-button" onClick={onNavigateBack}>
          <ArrowLeft className="back-icon" />
        </button>
        <h1 className="title">Blocked Posts</h1>
      </div>

      <div className="blocked-users-content">
        <div className="input-group">
          <input
            type="text"
            placeholder="Enter post link to block"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="text-input"
          />
          <button onClick={handleBlockUser} className="block-button" disabled={loading.blocking || !username}>
            {loading.blocking ? <Loader2 className="animate-spin" /> : "Block"}
          </button>
        </div>

        {message && <p className={`message ${message.type === "success" ? "success-message" : "error-message"}`}>{message.text}</p>}

        <div className="users-list-container">
          <h3 className="list-title">Blocked Posts</h3>
          <div className="users-list">
            {Array.isArray(blockedUsers) && blockedUsers.length > 0 ? (
             blockedUsers.map(({ userName, postId, _id }) => (
              <div key={_id} className="user-item">
                <div className="user-info">
                  <User className="user-icon" />
                  <div>
                    <span className="user-name">{userName}</span>
                    <p className="post-id text-xs text-muted-foreground">{postId}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveUser(postId)}
                  className="remove-button"
                  disabled={loading.unblocking === _id}
                >
                  {loading.unblocking === _id ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <X className="remove-icon" />
                  )}
                </button>
              </div>
            ))
            
            ) : (
              <p className="empty-message">No blocked posts</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
