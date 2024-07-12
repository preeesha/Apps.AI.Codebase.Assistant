export interface IDB {
    verifyConnectivity(): Promise<void>;

    closeDBConnection(): Promise<void>;
}
