export const isProStatus = (status, cancelled) => {
  if (cancelled) return false;
  return status === "active" || status === "on_trial" || status === "trialing";
};

export const getClientIdentity = (req, email, prefix = "") => {
  if (email) return `${prefix}email:${email}`;
  const forwarded = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwarded)
    ? forwarded[0]
    : typeof forwarded === "string"
      ? forwarded.split(",")[0].trim()
      : req.socket?.remoteAddress || "unknown";
  return `${prefix}ip:${ip}`;
};
