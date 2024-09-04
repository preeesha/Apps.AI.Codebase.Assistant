export interface IDB {
    /**
     * Verifies the connectivity to the database.
     * @returns A promise that resolves when the connectivity is verified.
     */
    verifyConnectivity(): Promise<void>;

    /**
     * Closes the connection to the database.
     * @returns A promise that resolves when the connection is closed.
     */
    closeDBConnection(): Promise<void>;

    /**
     * Begins a database transaction.
     * @returns A promise that resolves when the transaction is started.
     */
    beginTransaction(): Promise<void>;

    /**
     * Commits the current database transaction.
     * @returns A promise that resolves when the transaction is committed.
     */
    commitTransaction(): Promise<void>;

    /**
     * Rolls back the current database transaction.
     * @returns A promise that resolves when the transaction is rolled back.
     */
    rollbackTransaction(): Promise<void>;

    /**
     * Runs a database query.
     * @param query - The query string to execute.
     * @param params - Optional parameters for the query.
     * @returns A promise that resolves with an array of records returned by the query.
     */
    run(query: string, params?: any): Promise<Record<string, any>[]>;
}
