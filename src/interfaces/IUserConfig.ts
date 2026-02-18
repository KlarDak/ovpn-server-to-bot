/**
 * Interface representing the structure of a user configuration object. This interface defines the properties that a user configuration should have, including a unique identifier (uuid), version number, user type, creation timestamp, expiration timestamp, and status. The uuid property is a string that uniquely identifies the user, while the version property indicates the version of the user configuration. The user_type property specifies the type of user (e.g., admin, regular user), and the created_at and expired_time properties are ISO date strings representing when the user configuration was created and when it will expire, respectively. The status property indicates whether the user is active, inactive, or banned.
 */
export interface IUserConfig {
    uuid: string; // Unique identifier for the user
    version: number; // Version number of the user configuration
    user_type: string; // Type of user (e.g., admin, regular user)
    created_at: string; // ISO date string
    expired_time: string; // ISO date string
    status: "active" | "inactive" | "banned"; // Status of the user
}