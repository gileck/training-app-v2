const { MongoClient, ObjectId } = require('mongodb'); // Use require for JS
// Type imports removed for JS

// --- Configuration ---
// IMPORTANT: Replace with your actual MongoDB connection string
const MONGODB_URI = "mongodb+srv://gileck:EdzaigZENXq1tkmT@cluster0.yepuugh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const DATABASE_NAME = "test"; // Or your actual database name

// Test Data (Use ObjectIds relevant to your test data if needed)
const TEST_USER_ID = new ObjectId();
const TEST_PLAN_ID = new ObjectId();
const TEST_EXERCISE_ID = new ObjectId();
const TEST_WEEK = 1;
const TEST_TOTAL_SETS = 5;

// --- Copied Helper Function (JS Version) ---
async function getOrCreateWeeklyProgress(
    db,         // No type needed
    userId,     // No type needed
    planId,     // No type needed
    exerciseId, // No type needed
    weekNumber, // No type needed
    session     // No type needed
) {
    const now = new Date();
    const filter = { userId, planId, exerciseId, weekNumber };
    console.log(`[SCRIPT-getOrCreateWeeklyProgress] filter: ${JSON.stringify(filter)}`);
    const options = session ? { session } : {};

    const result = await db.collection('weeklyProgress').findOneAndUpdate(
        filter,
        {
            $setOnInsert: {
                userId, planId, exerciseId, weekNumber,
                setsCompleted: 0, isExerciseDone: false, weeklyNotes: [], createdAt: now,
            },
            $set: { lastUpdatedAt: now }
        },
        { upsert: true, returnDocument: 'after', ...options }
    );

    if (!result) {
        console.error("[SCRIPT] Failed to get or create weekly progress, findOneAndUpdate returned null", filter);
        throw new Error("Failed to retrieve or initialize weekly progress.");
    }
    console.log(`[SCRIPT-getOrCreateWeeklyProgress] result: ${JSON.stringify(result)}`);
    // Return the raw result object, applying defaults where needed at the point of use
    return result;
}

// --- Simplified Update Function (JS Version) ---
async function testUpdateProgress(
    db,         // No type needed
    userId,     // No type needed
    planId,     // No type needed
    exerciseId, // No type needed
    weekNumber, // No type needed
    increment,  // No type needed
    totalSets   // No type needed
) {
    console.log(`\n--- [SCRIPT-testUpdateProgress] Attempting update. Increment: ${increment} ---`);

    const weeklyUpdateResult = await db.collection('weeklyProgress').findOneAndUpdate(
        { userId, planId, exerciseId, weekNumber },
        [
            {
                $set: {
                    setsCompleted: { $max: [0, { $min: [totalSets, { $add: ["$setsCompleted", increment] }] }] },
                    lastUpdatedAt: new Date()
                }
            },
            {
                $set: {
                    isExerciseDone: { $gte: ["$setsCompleted", totalSets] },
                    completedAt: {
                        $cond: {
                            if: { $and: [{ $gte: ["$setsCompleted", totalSets] }, { $eq: ["$completedAt", undefined] }] },
                            then: new Date(), else: "$completedAt"
                        }
                    }
                }
            },
            {
                $set: {
                    completedAt: { $cond: { if: { $eq: ["$isExerciseDone", false] }, then: undefined, else: "$completedAt" } }
                }
            }
        ],
        { returnDocument: 'after' }
    );

    if (!weeklyUpdateResult) {
        console.error(`[SCRIPT-testUpdateProgress ERROR] Failed to find and update doc.`);
        return null;
    }
    console.log(`[SCRIPT-testUpdateProgress] Update Result: Sets=${weeklyUpdateResult.setsCompleted}, Done=${weeklyUpdateResult.isExerciseDone}`);
    return weeklyUpdateResult; // Return raw result
}

// --- Main Test Execution ---
async function runTest() {
    if (MONGODB_URI === "YOUR_CONNECTION_STRING_HERE") {
        console.error("ERROR: Please replace YOUR_CONNECTION_STRING_HERE in the script with your MongoDB URI.");
        return;
    }

    let client = null; // Initialize client to null
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log("Connected to MongoDB.");
    const db = client.db(DATABASE_NAME);

    const result = await db.collection('weeklyProgress').find({}).toArray()
    console.log(result);

    // 1. Ensure the document exists
    // console.log("\n--- Ensuring document exists ---");
    // await getOrCreateWeeklyProgress(db, TEST_USER_ID, TEST_PLAN_ID, TEST_EXERCISE_ID, TEST_WEEK);

    // Optional: Reset state before test loop if needed
    // await db.collection('weeklyProgress').updateOne(
    //    { userId: TEST_USER_ID, planId: TEST_PLAN_ID, exerciseId: TEST_EXERCISE_ID, weekNumber: TEST_WEEK },
    //    { $set: { setsCompleted: 0, isExerciseDone: false }, $unset: { completedAt: "" } }
    // );
    // console.log("--- Reset document state ---");

    // 2. Perform Incremental Updates (THIS WAS MISSING)
    //     console.log(`\n--- Performing ${TEST_TOTAL_SETS} incremental updates ---`);
    //     for (let i = 1; i <= TEST_TOTAL_SETS; i++) {
    //         console.log(`\nUpdate #${i}`);
    //         const currentDocBefore = await db.collection('weeklyProgress').findOne({ userId: TEST_USER_ID, planId: TEST_PLAN_ID, exerciseId: TEST_EXERCISE_ID, weekNumber: TEST_WEEK });
    //         console.log(`State BEFORE update #${i}: Sets=${currentDocBefore?.setsCompleted}, Done=${currentDocBefore?.isExerciseDone}`);
    //         await testUpdateProgress(db, TEST_USER_ID, TEST_PLAN_ID, TEST_EXERCISE_ID, TEST_WEEK, 1, TEST_TOTAL_SETS);
    //     }

    //     // 3. Final Check (THIS WAS MISSING)
    //     console.log("\n--- Final State Check ---");
    //     const finalDoc = await db.collection('weeklyProgress').findOne({ userId: TEST_USER_ID, planId: TEST_PLAN_ID, exerciseId: TEST_EXERCISE_ID, weekNumber: TEST_WEEK });
    //     console.log("Final Document State:", JSON.stringify(finalDoc, null, 2));

    //     if (finalDoc?.setsCompleted === TEST_TOTAL_SETS && finalDoc?.isExerciseDone === true) {
    //         console.log("\n✅ Test Passed: Final state matches expected.");
    //     } else {
    //         console.error(`\n❌ Test Failed: Expected Sets=${TEST_TOTAL_SETS}, Done=true. Got Sets=${finalDoc?.setsCompleted}, Done=${finalDoc?.isExerciseDone}`);
    //     }

    // } catch (error) {
    //     console.error("\n--- SCRIPT ERROR ---");
    //     console.error(error);
    // } finally {
    //     if (client) {
    //         await client.close();
    //         console.log("\nMongoDB connection closed."); // Moved log here
    //     }
    // }
}

runTest(); 