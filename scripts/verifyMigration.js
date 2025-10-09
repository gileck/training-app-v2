const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://gileck:jfxccnxeruiowqrioqsdjkla@cluster0.frtddwb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const DB_NAME = process.env.DB_NAME || 'trainingPlanDb';

const OLD_USER_ID = '685666405553dc1f1877ffaa';
const NEW_USER_ID = '68e76f8e0c3bce649b716f09';

async function verifyMigration() {
    const client = new MongoClient(MONGO_URI);

    try {
        await client.connect();
        console.log('Connected to MongoDB');
        console.log('='.repeat(60));
        console.log('MIGRATION VERIFICATION');
        console.log('='.repeat(60));
        console.log(`Old User ID: ${OLD_USER_ID}`);
        console.log(`New User ID: ${NEW_USER_ID}\n`);

        const db = client.db(DB_NAME);
        
        const collections = [
            'trainingPlans',
            'exercises',
            'savedWorkouts',
            'weeklyProgress',
            'exerciseActivityLog'
        ];

        let allClear = true;

        for (const collectionName of collections) {
            const collection = db.collection(collectionName);
            
            const oldCount = await collection.countDocuments({ 
                userId: new ObjectId(OLD_USER_ID) 
            });
            const newCount = await collection.countDocuments({ 
                userId: new ObjectId(NEW_USER_ID) 
            });
            
            const status = oldCount === 0 ? '✓' : '✗';
            console.log(`${status} ${collectionName}:`);
            console.log(`  Old userId: ${oldCount} documents`);
            console.log(`  New userId: ${newCount} documents`);
            
            if (oldCount > 0) {
                allClear = false;
            }
        }
        
        console.log('\n' + '='.repeat(60));
        if (allClear) {
            console.log('✓ ALL COLLECTIONS SUCCESSFULLY MIGRATED!');
            console.log('No documents with old user ID remain in any collection.');
        } else {
            console.log('⚠ WARNING: Some documents with old user ID still exist!');
        }
        console.log('='.repeat(60));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
        console.log('\nMongoDB connection closed');
    }
}

verifyMigration();

