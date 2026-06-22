// frontend/src/api/client.ts
// ─────────────────────────────────────────────────────
// مرکز ارتباط با backend API
// همه fetch call ها از اینجا رد میشن — یه جا برای
// مدیریت headers، error handling، و base URL
// ─────────────────────────────────────────────────────

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

function getToken(): string | null {
  return localStorage.getItem("token");  // در artifact واقعی از state استفاده میشه
}

async function request(endpoint: string, options: RequestInit = {}) {
  const token = getToken();

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

// ── Auth ──────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  register: (name: string, email: string, password: string) =>
    request("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) }),
};

// ── Tickets ───────────────────────────────────────────
export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  created_by_name: string;
  assigned_to_name: string | null;
  created_at: string;
}

export const ticketsApi = {
  getAll: (filters?: { status?: string; priority?: string }) => {
    const params = new URLSearchParams(filters as Record<string, string>);
    return request(`/tickets?${params}`);
  },

  getById: (id: number) => request(`/tickets/${id}`),

  create: (data: { title: string; description: string; priority: string; category: string }) =>
    request("/tickets", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: Partial<Ticket>) =>
    request(`/tickets/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  getComments: (id: number) => request(`/tickets/${id}/comments`),

  addComment: (id: number, body: string) =>
    request(`/tickets/${id}/comments`, { method: "POST", body: JSON.stringify({ body }) }),
};

export const usersApi = {
  getAll: () => request("/users"),
};
