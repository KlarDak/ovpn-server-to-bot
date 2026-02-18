/**
 * Interface representing the structure of a token configuration object. This interface defines the properties that a token configuration should have, including the subject (sub), audience (aud), issued at time (iat), expiration time (exp), user role, token type, and an optional UUID for user identification. The sub property typically represents the user ID, while the aud property represents the server ID. The iat and exp properties are timestamps indicating when the token was issued and when it will expire, respectively. The role property indicates the user's role (e.g., admin, user, guest, bot), and the type property specifies the type of token (e.g., create, recreate, update, delete, get, active, feedback). The optional uuid property can be used to uniquely identify a user if needed.
 */
export interface ITokenConfig {
  sub: string; // Subject (usually user ID)
  aud: string; // Audience (server ID)
  iat: number; // Issued at (timestamp)
  exp: number; // Expiration time (timestamp)
  role: "admin" | "user" | "guest" | "bot"; // User role
  type: "create" | "recreate" | "update" | "delete" | "get" | "active" | "feedback"; // Token type
  uuid?: string; // Optional UUID for user identification
}