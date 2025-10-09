const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://gileck:jfxccnxeruiowqrioqsdjkla@cluster0.frtddwb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const DB_NAME = process.env.DB_NAME || 'trainingPlanDb';

const OLD_USER_ID = '685666405553dc1f1877ffaa';

async function checkExercises() {
    const client = new MongoClient(MONGO_URI);

    try {
        await client.connect();
        console.log('Connected to MongoDB\n');

        const db = client.db(DB_NAME);
        const collection = db.collection('exercises');
        
        const totalCount = await collection.countDocuments({});
        console.log(`Total exercises: ${totalCount}\n`);
        
        // Check for exercises with old userId
        const withOldUserId = await collection.countDocuments({ 
            userId: new ObjectId(OLD_USER_ID) 
        });
        console.log(`Exercises with old userId field: ${withOldUserId}`);
        
        // Get a sample document to see structure
        const sample = await collection.findOne({});
        if (sample) {
            console.log('\nSample exercise document:');
            console.log(JSON.stringify(sample, null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
        console.log('\nMongoDB connection closed');
    }
}

checkExercises();

