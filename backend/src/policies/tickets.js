// Shared object-level authorization for every ticket endpoint.
function canAccessTicket(user, ticket) {
  if (!user || !ticket) return false;
  if (user.role === "admin") return true;
  if (user.role === "agent") return ticket.assigned_to === user.id;
  if (user.role === "user") return ticket.created_by === user.id;
  return false;
}
module.exports = { canAccessTicket };
