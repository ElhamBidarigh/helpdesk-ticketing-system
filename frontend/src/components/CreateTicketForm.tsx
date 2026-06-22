// frontend/src/components/CreateTicketForm.tsx

import { useState, FormEvent } from "react";
import { ticketsApi } from "../api/client";

interface Props {
  onCreated: () => void;
  onCancel: () => void;
}

export default function CreateTicketForm({ onCreated, onCancel }: Props) {
  const [title, setTitle]       = useState("");
  const [description, setDesc]  = useState("");
  const [priority, setPriority] = useState("medium");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await ticketsApi.create({ title, description, priority, category: "general" });
      onCreated();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", padding: 24, background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}>
      <h2 style={{ marginBottom: 16 }}>Create New Ticket</h2>
      <form onSubmit={handleSubmit}>
        <label style={labelStyle}>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required style={inputStyle} />

        <label style={labelStyle}>Description</label>
        <textarea value={description} onChange={(e) => setDesc(e.target.value)} required rows={4} style={{ ...inputStyle, resize: "vertical" }} />

        <label style={labelStyle}>Priority</label>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} style={inputStyle}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button type="submit" disabled={submitting} style={{ flex: 1, padding: 12, borderRadius: 8, background: "#1E88E5", color: "#fff", border: "none", cursor: "pointer" }}>
            {submitting ? "Creating…" : "Create Ticket"}
          </button>
          <button type="button" onClick={onCancel} style={{ flex: 1, padding: 12, borderRadius: 8, background: "#f0f0f0", color: "#555", border: "none", cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6, marginTop: 12 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" };
