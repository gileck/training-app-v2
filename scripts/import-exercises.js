// Import exercises from exercisesInfo.json into the database
// Usage: node scripts/import-exercises.js

const fs = require('fs');
const { MongoClient, ObjectId } = require('mongodb');

// Configuration - change these as needed
// const MONGO_URI = 'mongodb://localhost:27017';
// take from env
const MONGO_URI = "mongodb+srv://gileck:EdzaigZENXq1tkmT@cluster0.yepuugh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
const DB_NAME = 'trainingPlanDb';
const COLLECTION_NAME = 'exerciseDefinitions';
const JSON_FILE = 'scripts/exercisesInfo.json';

async function importExercises() {
    let client;

    try {
        // Read the JSON file
        console.log(`Reading exercises from ${JSON_FILE}...`);
        const data = fs.readFileSync(JSON_FILE, 'utf8');
        const exercises = JSON.parse(data);

        console.log(`Found ${exercises.length} exercises to import.`);

        // Connect to MongoDB
        client = new MongoClient(MONGO_URI);
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);

        // Keep track of import statistics
        let created = 0;
        let updated = 0;
        let errors = 0;

        // Import each exercise
        for (const exercise of exercises) {
            try {
                // Map the JSON structure to our database schema
                const exerciseDoc = {
                    name: exercise.name,
                    primaryMuscle: exercise.primaryMuscle,
                    secondaryMuscles: exercise.secondaryMuscles || [],
                    bodyWeight: exercise.bodyWeight || false,
                    type: exercise.category,
                    imageUrl: exercise.image || null,
                    updatedAt: new Date()
                };

                // Use upsert to create or update
                const result = await collection.updateOne(
                    { name: exercise.name },
                    {
                        $set: exerciseDoc,
                        $setOnInsert: { createdAt: new Date() }
                    },
                    { upsert: true }
                );

                if (result.upsertedCount > 0) {
                    created++;
                    console.log(`Created: ${exercise.name}`);
                } else if (result.modifiedCount > 0) {
                    updated++;
                    console.log(`Updated: ${exercise.name}`);
                } else {
                    console.log(`No changes needed for: ${exercise.name}`);
                }
            } catch (error) {
                errors++;
                console.error(`Error importing exercise ${exercise.name}:`, error);
            }
        }

        // Print summary
        console.log('\nImport completed:');
        console.log(`- Created: ${created}`);
        console.log(`- Updated: ${updated}`);
        console.log(`- Errors: ${errors}`);
        console.log(`- Total processed: ${exercises.length}`);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    } finally {
        // Close the database connection
        if (client) {
            await client.close();
            console.log('Database connection closed');
        }
    }
}

// Run the import function
importExercises().catch(console.error); 