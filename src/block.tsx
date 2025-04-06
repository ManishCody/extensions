import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, User, X, Loader2 } from "lucide-react";
import axios from "axios";

interface BlockedUsersProps {
  onNavigateBack: () => void;
  uuid: string;
}

function extractPostId(url: string) {
  const match = url.match(/activity-(\d+)/);
  return match ? match[1] : null;
}

export default function BlockedUsers({ onNavigateBack, uuid }: BlockedUsersProps) {
  const [username, setUsername] = useState("");
  const [blockedUsers, setBlockedUsers] = useState<{ postId: string; _id: string }[]>([]);
  const [loading, setLoading] = useState({ blocking: false, unblocking: null as string | null });
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/api/users/blocked-users/${uuid}`);
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

    const postId = extractPostId(username);
    if (!postId) {
      return setMessage({ text: "Invalid LinkedIn post URL.", type: "error" });
    }

    setLoading((prev) => ({ ...prev, blocking: true }));

    try {
      const { data } = await axios.post("http://localhost:5000/api/users/block-user", {
        uuid,
        blockUsername: postId,
      });

      chrome.storage?.local.get({ reportedPosts: [] }, ({ reportedPosts }) => {
        const updated = [...new Set([...reportedPosts, postId])];
        chrome.storage.local.set({ reportedPosts: updated }, () => {
          chrome.runtime.sendMessage({ action: "RE_EVALUATE_POSTS" });
        });
      });

      setBlockedUsers((prev) => [...prev, { postId, _id: data.blockedUserUUID }]);
      setMessage({ text: data.message, type: "success" });
      setUsername("");
    } catch (error: any) {
      setMessage({ text: error.response?.data?.error || "Failed to block post.", type: "error" });
    } finally {
      setLoading((prev) => ({ ...prev, blocking: false }));
    }
  }, [username, uuid]);

  const handleRemoveUser = useCallback(async (userId: string) => {
    setLoading((prev) => ({ ...prev, unblocking: userId }));

    try {
      const { data } = await axios.delete(`http://localhost:5000/api/users/block-user/<span class="math-inline">\{uuid\}/</span>{userId}`);
      setBlockedUsers(data.blockedUsers);
      setMessage({ text: "User unblocked successfully.", type: "success" });
    } catch (error: any) {
      setMessage({ text: error.response?.data?.error || "Failed to unblock user.", type: "error" });
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
            {blockedUsers.length > 0 ? (
              blockedUsers.map(({ postId, _id }) => (
                <div key={_id} className="user-item">
                  <div className="user-info">
                    <User className="user-icon" />
                    <span className="user-name">{postId}</span>
                  </div>
                  <button onClick={() => handleRemoveUser(_id)} className="remove-button" disabled={loading.unblocking === _id}>
                    {loading.unblocking === _id ? <Loader2 className="animate-spin" /> : <X className="remove-icon" />}
                  </button>
                </div>
              ))
            ) : (
              <p className="empty-message">No blocked users</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
