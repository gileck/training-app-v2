import { MongoClient } from 'mongodb';
import { FullConfig } from '@playwright/test';

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://gileck:EdzaigZENXq1tkmT@cluster0.yepuugh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const TEST_DB_NAME = 'trainingPlanDb_test';

async function globalTeardown(config: FullConfig) {
    console.log('🧹 Cleaning up test database...');

    let client: MongoClient | null = null;

    try {
        client = new MongoClient(MONGO_URI);
        await client.connect();

        const db = client.db(TEST_DB_NAME);

        // Drop the test database to clean up all test data
        await db.dropDatabase();

        console.log('✅ Test database cleanup complete!');
        console.log(`- Dropped database: ${TEST_DB_NAME}`);

    } catch (error) {
        console.error('❌ Failed to cleanup test database:', error);
        // Don't throw error in teardown to avoid masking test failures
    } finally {
        if (client) {
            await client.close();
        }
    }
}

export default globalTeardown; 