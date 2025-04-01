import { useState, useEffect } from "react";
import { ArrowLeft, User, X, Loader2 } from "lucide-react";
import axios from "axios";

interface BlockedUsersProps {
  onNavigateBack: () => void;
  uuid: string;
}

export default function BlockedUsers({ onNavigateBack, uuid }: BlockedUsersProps) {
  const [username, setUsername] = useState("");
  const [blockedUsers, setBlockedUsers] = useState<any>([]);
  const [isBlocking, setIsBlocking] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "" }>({ text: "", type: "" });

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/users/blocked-users/${uuid}`);
        setBlockedUsers(response.data.blockedUsers);

      } catch (error: any) {
        setMessage({ text: "Failed to load blocked users.", type: "error" });
      }
    };

    fetchBlockedUsers();
  }, [uuid]);

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ text: "", type: "" }), 2000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleBlockUser = async () => {
    if (!username.trim()) {
      setMessage({ text: "Please enter a username to block.", type: "error" });
      return;
    }

    setIsBlocking(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await axios.post("http://localhost:5000/api/users/block-user", {
        uuid,
        blockUsername: username,
      });

      setMessage({ text: response.data.message, type: "success" });
      setBlockedUsers([...blockedUsers, { username, _id: response.data.blockedUserId }]);
      setUsername("");
    } catch (error: any) {
      setMessage({ text: error.response?.data?.error || "Failed to block user.", type: "error" });
    } finally {
      setIsBlocking(false);
    }
  };

  const handleRemoveUser = (userToRemove: string) => {
    setBlockedUsers(blockedUsers.filter((user: any) => user !== userToRemove));
  };

  return (
    <div className="blocked-users-container">
      <div className="blocked-users-header">
        <button className="back-button" onClick={onNavigateBack}>
          <ArrowLeft className="back-icon" />
        </button>
        <h1 className="title">Blocked Users</h1>
      </div>

      <div className="blocked-users-content">
        <div className="input-group">
          <input
            type="text"
            placeholder="Enter username to block"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="text-input"
          />
          <button onClick={handleBlockUser} className="block-button" disabled={isBlocking || !username}>
            {isBlocking ? <Loader2 className="animate-spin" /> : "Block"}
          </button>
        </div>

        {message.text && (
          <p className={`message ${message.type === "success" ? "success-message" : "error-message"} `}>
            {message.text}
          </p>
        )}


        <div className="users-list-container">
          <h3 className="list-title">Blocked Users</h3>
          <div className="users-list">
            {blockedUsers.length > 0 ? (
              blockedUsers.map((user: any) => (
                <div key={user._id} className="user-item">
                  <div className="user-info">
                    <User className="user-icon" />
                    <span className="user-name">{user.username}</span>
                  </div>
                  <button onClick={() => handleRemoveUser(user.username)} className="remove-button">
                    <X className="remove-icon" />
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
