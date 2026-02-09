export interface ITokenConfig {
  sub: string; // Subject (usually user ID)
  aud: string; // Audience (server ID)
  iat: number; // Issued at (timestamp)
  exp: number; // Expiration time (timestamp)
  role: "admin" | "user" | "guest" | "bot"; // User role
  type: "create" | "recreate" | "update" | "delete" | "get" | "active" | "feedback"; // Token type
  uuid?: string; // Optional UUID for user identification
}