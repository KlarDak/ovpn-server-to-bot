export interface ITokenConfig {
  sub: string; // Subject (usually user ID)
  aud: string; // Audience (server ID)
  iat: number; // Issued at (timestamp)
  exp: number; // Expiration time (timestamp)
  role: "admin" | "user" | "guest"; // User role
  type: "create" | "recreate" | "update" | "delete"; // Token type
  uuid?: string; // Optional UUID for user identification
}