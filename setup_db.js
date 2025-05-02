// MongoDB Setup Script (for use with mongosh)
// Example usage: mongosh "mongodb://localhost:27017" --file setup_db.js
// Or pass connection string via environment variable: MONGO_URI="mongodb+srv://..." mongosh --file setup_db.js

// --- Configuration ---
const dbName = 'trainingPlanDb'; // Replace with your desired database name

// --- Script Logic ---
try {
    // Determine MongoDB connection URI
    // const mongoURI = process.env.MONGO_URI
    // print(`Connecting to MongoDB at ${mongoURI}...`);

    // Connect to MongoDB instance and get the specific database
    // Note: 'connect()' is deprecated in modern mongosh, but db = getDB(dbName) works after connection.
    // However, for script compatibility, we often assume the connection is made when invoking mongosh.
    // If running directly in mongosh, you might just use 'use(dbName)' first.
    // This script assumes 'db' is implicitly the database selected via connection string or prior 'use' command.
    // If connecting directly within the script is needed, consider using a Node.js driver script instead.

    // Switch to the target database
    db = db.getSiblingDB(dbName);
    print(`Switched to database: ${db.getName()}`);

    // 1. Create Collections (Optional but good for clarity)
    print('\n--- Creating Collections ---');
    const collections = [
        "users",
        "trainingPlans",
        "exerciseDefinitions",
        "exercises",
        "savedWorkouts",
        "weeklyProgress",
        "exerciseActivityLog"
    ];
    collections.forEach(coll => {
        const existingCollections = db.getCollectionNames();
        if (existingCollections.indexOf(coll) === -1) {
            db.createCollection(coll);
            print(`Collection '${coll}' created.`);
        } else {
            print(`Collection '${coll}' already exists.`);
        }
    });

    // 2. Create Indexes
    print('\n--- Creating Indexes ---');

    // Users
    db.users.createIndex({ username: 1 }, { unique: true, background: true });
    print(`Index created on users: username (unique)`);
    db.users.createIndex({ email: 1 }, { unique: true, background: true });
    print(`Index created on users: email (unique)`);

    // TrainingPlans
    db.trainingPlans.createIndex({ userId: 1 }, { background: true });
    print(`Index created on trainingPlans: userId`);

    // ExerciseDefinitions
    db.exerciseDefinitions.createIndex({ name: 1 }, { unique: true, background: true });
    print(`Index created on exerciseDefinitions: name (unique)`);

    // Exercises
    db.exercises.createIndex({ planId: 1 }, { background: true });
    print(`Index created on exercises: planId`);
    db.exercises.createIndex({ definitionId: 1 }, { background: true });
    print(`Index created on exercises: definitionId`);

    // SavedWorkouts
    db.savedWorkouts.createIndex({ userId: 1 }, { background: true });
    print(`Index created on savedWorkouts: userId`);

    // WeeklyProgress
    // Compound index for specific weekly progress lookup
    db.weeklyProgress.createIndex({ userId: 1, planId: 1, exerciseId: 1, weekNumber: 1 }, { background: true });
    print(`Compound Index created on weeklyProgress: userId, planId, exerciseId, weekNumber`);

    // ExerciseActivityLog
    // Compound index for daily progress view query
    db.exerciseActivityLog.createIndex({ userId: 1, date: 1 }, { background: true });
    print(`Compound Index created on exerciseActivityLog: userId, date`);
    // Optional index for specific exercise lookup on a date
    db.exerciseActivityLog.createIndex({ userId: 1, exerciseId: 1, date: 1 }, { background: true });
    print(`Compound Index created on exerciseActivityLog: userId, exerciseId, date`);

    print('\nIndexes created successfully (if they did not already exist).');


    // 3. Seed Data (Optional)
    print('\n--- Seeding Data (Exercise Definitions) ---');
    const commonExercises = [
        { name: "Bench Press", imageUrl: null, defaultTargetMuscles: ["Chest", "Triceps", "Shoulders"] },
        { name: "Squat", imageUrl: null, defaultTargetMuscles: ["Quadriceps", "Glutes", "Hamstrings"] },
        { name: "Deadlift", imageUrl: null, defaultTargetMuscles: ["Back", "Glutes", "Hamstrings", "Quadriceps"] },
        { name: "Overhead Press", imageUrl: null, defaultTargetMuscles: ["Shoulders", "Triceps"] },
        { name: "Barbell Row", imageUrl: null, defaultTargetMuscles: ["Back", "Biceps"] },
        { name: "Pull-up", imageUrl: null, defaultTargetMuscles: ["Back", "Biceps"] },
        { name: "Push-up", imageUrl: null, defaultTargetMuscles: ["Chest", "Triceps", "Shoulders"] },
        { name: "Bicep Curl", imageUrl: null, defaultTargetMuscles: ["Biceps"] },
        { name: "Triceps Extension", imageUrl: null, defaultTargetMuscles: ["Triceps"] },
        { name: "Running", imageUrl: null, defaultTargetMuscles: ["Cardio", "Legs"] },
        { name: "Cycling", imageUrl: null, defaultTargetMuscles: ["Cardio", "Legs"] },
    ];

    let seededCount = 0;
    let updatedCount = 0; // Note: Mongoose upsert gives modifiedCount, mongosh gives matchedCount

    commonExercises.forEach(ex => {
        const result = db.exerciseDefinitions.updateOne(
            { name: ex.name }, // Filter by name
            { $setOnInsert: { name: ex.name, imageUrl: ex.imageUrl, defaultTargetMuscles: ex.defaultTargetMuscles, createdAt: new Date(), updatedAt: new Date() } }, // Fields to set only on insert
            { upsert: true } // Options: insert if not found
        );

        if (result.upsertedCount > 0) {
            seededCount++;
            print(`Seeded exercise definition: ${ex.name}`);
        } else if (result.matchedCount > 0) {
            // Optionally update fields if needed on match, e.g., updatedAt
            // db.exerciseDefinitions.updateOne({ name: ex.name }, { $set: { updatedAt: new Date() } });
            updatedCount++; // Keep track if needed, though we only set on insert here
            print(`Exercise definition already exists: ${ex.name}`);
        }
    });
    print(`Seeding complete. New definitions seeded: ${seededCount}. Existing definitions matched: ${updatedCount}.`);


    print('\n--- Database Setup Script Finished ---');

} catch (error) {
    printe(`Error during database setup: ${error}`);
    // Consider exiting with an error code if needed for automation
    // quit(1); // Uncomment if running in a script that needs failure indication
} 