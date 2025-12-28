export interface IUserConfig {
    uuid: string;
    version: number;
    user_type: string;
    created_at: string; // ISO date string
    expired_time: string; // ISO date string
    status: "active" | "inactive" | "banned";
}