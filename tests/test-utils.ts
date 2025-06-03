import { MongoClient, ObjectId } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://gileck:EdzaigZENXq1tkmT@cluster0.yepuugh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const TEST_DB_NAME = 'trainingPlanDb_test';

let clientInstance: MongoClient | null = null;

export async function getTestDb() {
    if (!clientInstance) {
        clientInstance = new MongoClient(MONGO_URI);
        await clientInstance.connect();
    }
    return clientInstance.db(TEST_DB_NAME);
}

export async function closeTestDbConnection() {
    if (clientInstance) {
        await clientInstance.close();
        clientInstance = null;
    }
}

export async function createTestTrainingPlan(name: string, userId?: ObjectId) {
    const db = await getTestDb();

    // Get test user if no userId provided
    if (!userId) {
        const testUser = await db.collection('users').findOne({ username: 'testuser' });
        if (!testUser) {
            throw new Error('Test user not found. Make sure global setup ran successfully.');
        }
        userId = testUser._id as ObjectId;
    }

    const planData = {
        _id: new ObjectId(),
        userId,
        name,
        description: `Test plan: ${name}`,
        durationWeeks: 8,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    await db.collection('trainingPlans').insertOne(planData);
    return planData;
}

export async function createTestExercise(trainingPlanId: ObjectId, week: number, day: number) {
    const db = await getTestDb();

    // Get a random exercise definition
    const exerciseDefinition = await db.collection('exerciseDefinitions').findOne({});
    if (!exerciseDefinition) {
        throw new Error('No exercise definitions found. Make sure global setup ran successfully.');
    }

    const exerciseData = {
        _id: new ObjectId(),
        trainingPlanId,
        exerciseDefinitionId: exerciseDefinition._id,
        week,
        day,
        sets: 3,
        reps: 10,
        weight: 50,
        restTime: 60,
        notes: 'Test exercise',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    await db.collection('exercises').insertOne(exerciseData);
    return exerciseData;
}

export async function cleanupTestData() {
    const db = await getTestDb();

    // Remove all data except users and exercise definitions (they're recreated in setup)
    await db.collection('trainingPlans').deleteMany({});
    await db.collection('exercises').deleteMany({});
    await db.collection('savedWorkouts').deleteMany({});
    await db.collection('exerciseActivityLog').deleteMany({});
    await db.collection('weeklyProgress').deleteMany({});
}

export async function getTestUser() {
    const db = await getTestDb();
    const testUser = await db.collection('users').findOne({ username: 'testuser' });
    if (!testUser) {
        throw new Error('Test user not found. Make sure global setup ran successfully.');
    }
    return testUser;
}

export async function getTestTrainingPlans() {
    const db = await getTestDb();
    return await db.collection('trainingPlans').find({}).toArray();
}

export async function getTestExerciseDefinitions() {
    const db = await getTestDb();
    return await db.collection('exerciseDefinitions').find({}).toArray();
} 