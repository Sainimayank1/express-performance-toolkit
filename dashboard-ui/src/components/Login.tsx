import React, { useState } from "react";
import { Zap, Lock, User, Loader2 } from "lucide-react";

interface LoginProps {
  onLoginSuccess: () => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const resp = await fetch("./api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await resp.json();

      if (data.success) {
        onLoginSuccess();
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper animate-in">
      <div className="login-card panel">
        <div className="login-header">
          <div className="brand-icon" style={{ margin: '0 auto 1.5rem', width: '48px', height: '48px' }}>
            <Zap size={24} />
          </div>
          <h1>Dashboard Access</h1>
          <p>Please enter your credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <User size={18} className="input-icon" />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <Lock size={18} className="input-icon" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Unlock Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
