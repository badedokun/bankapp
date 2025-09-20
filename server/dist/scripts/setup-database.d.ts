/**
 * Database Setup Script
 * Sets up PostgreSQL database and runs migrations
 */
declare function setupDatabase(): Promise<void>;
declare function seedData(): Promise<void>;
declare const _default: {
    setupDatabase: typeof setupDatabase;
    seedData: typeof seedData;
};
export default _default;
//# sourceMappingURL=setup-database.d.ts.map