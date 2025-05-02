import { MongoClient, Db } from 'mongodb';

// --- Configuration ---
// Read connection string and DB name from environment variables
// Fallback to defaults for local development if needed
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || 'trainingPlanDb'; // Use the same default as setup_db.js

// --- Connection Management (Singleton Pattern) ---
let client: MongoClient | null = null;
let dbInstance: Db | null = null;
let connectionPromise: Promise<Db> | null = null;

/**
 * Establishes a connection to the MongoDB database.
 * Uses a singleton pattern to ensure only one connection is made.
 * @returns {Promise<Db>} A promise that resolves with the Db instance.
 */
async function connectToDatabase(): Promise<Db> {
    if (dbInstance) {
        return dbInstance;
    }

    if (!MONGO_URI) {
        throw new Error('MONGO_URI environment variable is not set.');
    }

    if (!client) {
        client = new MongoClient(MONGO_URI);
        console.log('Connecting to MongoDB...');
        try {
            await client.connect();
            console.log('MongoDB connected successfully.');
            dbInstance = client.db(DB_NAME);
            // Add listeners for connection events (optional but recommended)
            client.on('close', () => {
                console.log('MongoDB connection closed.');
                client = null;
                dbInstance = null;
                connectionPromise = null; // Allow reconnection attempt
            });
            client.on('error', (err) => {
                console.error('MongoDB connection error:', err);
                client = null;
                dbInstance = null;
                connectionPromise = null;
            });
        } catch (error) {
            console.error('Failed to connect to MongoDB:', error);
            client = null; // Ensure client is nullified on error
            throw error; // Re-throw error to indicate connection failure
        }
    }

    // This check should ideally be redundant if connect succeeded
    if (!dbInstance) {
        throw new Error("Database instance not available after connection attempt.")
    }

    return dbInstance;
}

/**
 * Gets the singleton Db instance.
 * Handles the initial connection promise.
 * @returns {Promise<Db>} A promise that resolves with the Db instance.
 */
export function getDb(): Promise<Db> {
    if (!connectionPromise) {
        connectionPromise = connectToDatabase();
    }
    return connectionPromise;
}

// Optional: Graceful shutdown function (call this on app termination)
export async function closeDbConnection(): Promise<void> {
    if (client) {
        console.log('Closing MongoDB connection...');
        try {
            await client.close();
        } catch (error) {
            console.error('Error closing MongoDB connection:', error);
        }
    }
} 