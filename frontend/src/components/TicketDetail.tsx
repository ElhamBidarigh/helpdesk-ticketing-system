// frontend/src/components/TicketDetail.tsx

import { useState, useEffect } from "react";
import { ticketsApi, Ticket } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface Comment {
  id: number;
  body: string;
  user_name: string;
  user_role: string;
  created_at: string;
}

interface Props {
  ticketId: number;
  onBack: () => void;
}

export default function TicketDetail({ ticketId, onBack }: Props) {
  const { user } = useAuth();
  const [ticket, setTicket]    = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  const canManage = user?.role === "admin" || user?.role === "agent";

  useEffect(() => {
    load();
  }, [ticketId]);

  async function load() {
    setLoading(true);
    const [t, c] = await Promise.all([
      ticketsApi.getById(ticketId),
      ticketsApi.getComments(ticketId),
    ]);
    setTicket(t);
    setComments(c);
    setLoading(false);
  }

  async function handleStatusChange(status: string) {
    await ticketsApi.update(ticketId, { status: status as Ticket["status"] });
    load();
  }

  async function handleAddComment() {
    if (!newComment.trim()) return;
    await ticketsApi.addComment(ticketId, newComment);
    setNewComment("");
    load();
  }

  if (loading || !ticket) return <p style={{ textAlign: "center", padding: 40 }}>Loading…</p>;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 24 }}>
      <button onClick={onBack} style={{ marginBottom: 16, background: "none", border: "none", color: "#1E88E5", cursor: "pointer", fontSize: 14 }}>
        ← Back to tickets
      </button>

      <div style={{ background: "#fff", borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <h2 style={{ marginBottom: 8 }}>{ticket.title}</h2>
        <p style={{ color: "#666", marginBottom: 16 }}>{ticket.description}</p>

        <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#888", marginBottom: canManage ? 16 : 0 }}>
          <span>Priority: <strong>{ticket.priority}</strong></span>
          <span>By: {ticket.created_by_name}</span>
          {ticket.assigned_to_name && <span>Assigned: {ticket.assigned_to_name}</span>}
        </div>

        {canManage && (
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>Update Status</label>
            <select
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              style={{ display: "block", marginTop: 6, padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd" }}
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        )}
      </div>

      {/* Comments */}
      <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <h3 style={{ fontSize: 15, marginBottom: 12 }}>Comments</h3>
        {comments.map((c) => (
          <div key={c.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>
            <strong style={{ fontSize: 13 }}>{c.user_name}</strong>
            <span style={{ fontSize: 11, color: "#aaa", marginLeft: 8 }}>{c.user_role}</span>
            <p style={{ fontSize: 13, color: "#555", margin: "4px 0 0" }}>{c.body}</p>
          </div>
        ))}

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment…"
            style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd" }}
          />
          <button onClick={handleAddComment} style={{ padding: "8px 16px", borderRadius: 8, background: "#1E88E5", color: "#fff", border: "none", cursor: "pointer" }}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
