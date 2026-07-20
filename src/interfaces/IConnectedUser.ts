export interface IConnectedUser {
    uuid: string;
    user_type: string;
    created_at: string;
    expired_time: string|null;
    status: string;
    reaip: string;
    virtualip: string;
    connectedsince: string;
    bytes_received: number;
    bytes_sent: number;
}