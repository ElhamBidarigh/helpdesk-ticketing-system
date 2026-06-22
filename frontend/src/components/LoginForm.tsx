// frontend/src/components/LoginForm.tsx

import { useState, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";

export default function LoginForm() {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail]       = useState("admin@helpdesk.com");
  const [password, setPassword] = useState("password123");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await login(email, password);
    } catch {
      // error از context نمایش داده میشه
    }
  }

  return (
    <div style={styles.page}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h1 style={styles.title}>🎫 Helpdesk Login</h1>
        <p style={styles.subtitle}>Ticketing System Demo</p>

        {error && <div style={styles.error}>{error}</div>}

        <label style={styles.label}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
        />

        <label style={styles.label}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
        />

        <button type="submit" disabled={isLoading} style={styles.button}>
          {isLoading ? "Signing in…" : "Sign In"}
        </button>

        <div style={styles.demoHint}>
          <strong>Demo accounts:</strong><br />
          admin@helpdesk.com (Admin)<br />
          sara@helpdesk.com (Agent)<br />
          ali@helpdesk.com (User)<br />
          Password: password123
        </div>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page:    { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0F2D52" },
  form:    { background: "#fff", borderRadius: 16, padding: 32, width: 360, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" },
  title:   { fontSize: 22, fontWeight: 700, marginBottom: 4, color: "#1a1a2e" },
  subtitle:{ fontSize: 13, color: "#888", marginBottom: 20 },
  label:   { display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6, marginTop: 12 },
  input:   { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" },
  button:  { width: "100%", padding: 12, marginTop: 20, borderRadius: 8, background: "#1E88E5", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" },
  error:   { background: "#fee", color: "#c00", padding: "8px 12px", borderRadius: 8, fontSize: 13, marginBottom: 8 },
  demoHint:{ marginTop: 20, padding: 12, background: "#f5f5f5", borderRadius: 8, fontSize: 11, color: "#666", lineHeight: 1.6 },
};
