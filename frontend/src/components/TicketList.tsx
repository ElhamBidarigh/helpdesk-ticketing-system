// frontend/src/components/TicketList.tsx

import { useState, useEffect } from "react";
import { ticketsApi, Ticket } from "../api/client";
import { useAuth } from "../context/AuthContext";

const STATUS_COLORS: Record<string, string> = {
  open: "#1E88E5", in_progress: "#faad14", resolved: "#52c41a", closed: "#999",
};
const PRIORITY_COLORS: Record<string, string> = {
  low: "#52c41a", medium: "#1E88E5", high: "#faad14", urgent: "#ff4d4f",
};

interface Props {
  onSelectTicket: (id: number) => void;
  onCreateNew: () => void;
}

export default function TicketList({ onSelectTicket, onCreateNew }: Props) {
  const { user, logout } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    loadTickets();
  }, [statusFilter]);

  async function loadTickets() {
    setLoading(true);
    try {
      const data = await ticketsApi.getAll(statusFilter ? { status: statusFilter } : undefined);
      setTickets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>🎫 Tickets</h1>
          <p style={{ fontSize: 13, color: "#888", margin: "4px 0 0" }}>
            Logged in as <strong>{user?.name}</strong> ({user?.role})
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCreateNew} style={btnPrimary}>+ New Ticket</button>
          <button onClick={logout} style={btnSecondary}>Logout</button>
        </div>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 16 }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <p style={{ textAlign: "center", color: "#888" }}>Loading tickets…</p>
      ) : tickets.length === 0 ? (
        <p style={{ textAlign: "center", color: "#888", padding: 40 }}>No tickets found.</p>
      ) : (
        tickets.map((t) => (
          <div key={t.id} onClick={() => onSelectTicket(t.id)} style={ticketCard}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <strong style={{ fontSize: 15 }}>{t.title}</strong>
              <span style={{ ...pill, background: STATUS_COLORS[t.status] }}>
                {t.status.replace("_", " ")}
              </span>
            </div>
            <p style={{ fontSize: 13, color: "#888", margin: "0 0 8px" }}>{t.description.slice(0, 100)}…</p>
            <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#666" }}>
              <span style={{ color: PRIORITY_COLORS[t.priority] }}>● {t.priority}</span>
              <span>By: {t.created_by_name}</span>
              {t.assigned_to_name && <span>Assigned: {t.assigned_to_name}</span>}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const btnPrimary: React.CSSProperties   = { padding: "8px 16px", borderRadius: 8, background: "#1E88E5", color: "#fff", border: "none", cursor: "pointer", fontSize: 13 };
const btnSecondary: React.CSSProperties = { padding: "8px 16px", borderRadius: 8, background: "#f0f0f0", color: "#555", border: "none", cursor: "pointer", fontSize: 13 };
const selectStyle: React.CSSProperties  = { padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13 };
const ticketCard: React.CSSProperties   = { background: "#fff", borderRadius: 10, padding: 16, marginBottom: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", cursor: "pointer" };
const pill: React.CSSProperties = { fontSize: 11, padding: "2px 10px", borderRadius: 12, color: "#fff", textTransform: "capitalize" };
