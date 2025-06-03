import { MongoClient, ObjectId } from 'mongodb';
import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://gileck:EdzaigZENXq1tkmT@cluster0.yepuugh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const TEST_DB_NAME = 'trainingPlanDb_test';

async function globalSetup(config: FullConfig) {
    console.log('🚀 Setting up test database...');

    let client: MongoClient | null = null;

    try {
        client = new MongoClient(MONGO_URI);
        await client.connect();

        const db = client.db(TEST_DB_NAME);

        // Clean existing test data
        console.log('🧹 Cleaning existing test data...');
        await db.dropDatabase();

        // Create test user
        console.log('👤 Creating test user...');
        const testUserId = new ObjectId('683d55838f9d6cbb9cb17132'); // Fixed ID for tests
        await db.collection('users').insertOne({
            _id: testUserId,
            username: 'testuser',
            email: 'test@example.com',
            password_hash: '$2b$10$dummy.hash.for.test.user.only',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Import exercise definitions
        console.log('💪 Importing exercise definitions...');
        const exercisesPath = path.join(process.cwd(), 'scripts', 'exercisesInfo.json');
        const exercisesData = JSON.parse(fs.readFileSync(exercisesPath, 'utf8'));

        const exerciseDefinitions = exercisesData.slice(0, 50).map((exercise: any) => ({
            _id: new ObjectId(),
            name: exercise.name,
            primaryMuscle: exercise.primaryMuscle,
            secondaryMuscles: exercise.secondaryMuscles || [],
            bodyWeight: exercise.bodyWeight || false,
            type: exercise.category,
            imageUrl: exercise.image || '',
            static: false
        }));

        await db.collection('exerciseDefinitions').insertMany(exerciseDefinitions);

        // Create test training plans
        console.log('📋 Creating test training plans...');
        const now = new Date();
        const testPlans = [
            {
                _id: new ObjectId(),
                userId: testUserId,
                name: 'Test Plan 1',
                description: 'First test training plan',
                durationWeeks: 8,
                isActive: false,
                createdAt: now,
                updatedAt: now
            },
            {
                _id: new ObjectId(),
                userId: testUserId,
                name: 'Test Plan 2',
                description: 'Second test training plan',
                durationWeeks: 12,
                isActive: false,
                createdAt: now,
                updatedAt: now
            }
        ];

        await db.collection('trainingPlans').insertMany(testPlans);

        // Create some test exercises for the plans
        console.log('🏋️ Creating test exercises...');
        const sampleExerciseIds = exerciseDefinitions.slice(0, 5).map((ex: any) => ex._id);
        const testExercises = [];

        for (let planIndex = 0; planIndex < testPlans.length; planIndex++) {
            for (let week = 1; week <= 2; week++) {
                for (let day = 1; day <= 3; day++) {
                    for (let exerciseIndex = 0; exerciseIndex < 3; exerciseIndex++) {
                        testExercises.push({
                            _id: new ObjectId(),
                            userId: testUserId,
                            planId: testPlans[planIndex]._id,
                            definitionId: sampleExerciseIds[exerciseIndex],
                            week,
                            day,
                            sets: 3,
                            reps: '10',
                            weight: '50',
                            orderInPlan: (exerciseIndex + 1) + (day - 1) * 3 + (week - 1) * 9,
                            restTime: 60,
                            comments: `Test exercise ${exerciseIndex + 1}`,
                            createdAt: now,
                            updatedAt: now
                        });
                    }
                }
            }
        }

        await db.collection('exercises').insertMany(testExercises);

        // Set the test user ID as an environment variable for the tests
        process.env.TEST_USER_ID = testUserId.toString();

        console.log('✅ Test database setup complete!');
        console.log(`- Database: ${TEST_DB_NAME}`);
        console.log(`- User ID: ${testUserId}`);
        console.log(`- Exercise definitions: ${exerciseDefinitions.length}`);
        console.log(`- Training plans: ${testPlans.length}`);
        console.log(`- Exercises: ${testExercises.length}`);

    } catch (error) {
        console.error('❌ Failed to setup test database:', error);
        throw error;
    } finally {
        if (client) {
            await client.close();
        }
    }
}

export default globalSetup; 