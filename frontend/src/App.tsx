// frontend/src/App.tsx
// ─────────────────────────────────────────────────────
// Main App — simple view-based "routing" (بدون react-router
// برای سادگی؛ در production از react-router-dom استفاده میشه)
// ─────────────────────────────────────────────────────

import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginForm from "./components/LoginForm";
import TicketList from "./components/TicketList";
import TicketDetail from "./components/TicketDetail";
import CreateTicketForm from "./components/CreateTicketForm";

type View = "list" | "detail" | "create";

function AppContent() {
  const { user } = useAuth();
  const [view, setView] = useState<View>("list");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  if (!user) return <LoginForm />;

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8" }}>
      {view === "list" && (
        <TicketList
          onSelectTicket={(id) => { setSelectedId(id); setView("detail"); }}
          onCreateNew={() => setView("create")}
        />
      )}
      {view === "detail" && selectedId && (
        <TicketDetail ticketId={selectedId} onBack={() => setView("list")} />
      )}
      {view === "create" && (
        <CreateTicketForm
          onCreated={() => setView("list")}
          onCancel={() => setView("list")}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
