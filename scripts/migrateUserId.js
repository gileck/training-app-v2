const { MongoClient, ObjectId } = require('mongodb');

// Read environment variables directly
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://gileck:jfxccnxeruiowqrioqsdjkla@cluster0.frtddwb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const DB_NAME = process.env.DB_NAME || 'trainingPlanDb';

const OLD_USER_ID = '685666405553dc1f1877ffaa';
const NEW_USER_ID = '68e76f8e0c3bce649b716f09';

async function migrateUserId() {
    console.log('Starting user ID migration...');
    console.log(`Old User ID: ${OLD_USER_ID}`);
    console.log(`New User ID: ${NEW_USER_ID}`);
    console.log('');

    if (!MONGO_URI) {
        throw new Error('MONGO_URI environment variable is not set.');
    }

    const client = new MongoClient(MONGO_URI);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db(DB_NAME);
        
        // Verify the new user exists
        const newUser = await db.collection('users').findOne({ _id: new ObjectId(NEW_USER_ID) });
        if (!newUser) {
            console.error(`ERROR: New user with ID ${NEW_USER_ID} does not exist!`);
            return;
        }
        console.log(`✓ Verified new user exists: ${newUser.username || newUser.email}`);
        console.log('');

        // Collections to update
        const collectionsToUpdate = [
            'trainingPlans',
            'exercises',
            'savedWorkouts',
            'weeklyProgress',
            'exerciseActivityLog'
        ];

        const results = {};

        for (const collectionName of collectionsToUpdate) {
            console.log(`Processing collection: ${collectionName}`);
            
            const collection = db.collection(collectionName);
            
            // Count documents with old user ID
            const oldCount = await collection.countDocuments({ 
                userId: new ObjectId(OLD_USER_ID) 
            });
            
            console.log(`  Found ${oldCount} documents with old user ID`);

            if (oldCount > 0) {
                // Update all documents
                const updateResult = await collection.updateMany(
                    { userId: new ObjectId(OLD_USER_ID) },
                    { $set: { userId: new ObjectId(NEW_USER_ID) } }
                );

                console.log(`  ✓ Updated ${updateResult.modifiedCount} documents`);
                results[collectionName] = {
                    found: oldCount,
                    modified: updateResult.modifiedCount
                };
            } else {
                console.log(`  No documents to update`);
                results[collectionName] = {
                    found: 0,
                    modified: 0
                };
            }
            
            // Verify update
            const remainingOld = await collection.countDocuments({ 
                userId: new ObjectId(OLD_USER_ID) 
            });
            
            const newCount = await collection.countDocuments({ 
                userId: new ObjectId(NEW_USER_ID) 
            });
            
            console.log(`  Documents with old user ID remaining: ${remainingOld}`);
            console.log(`  Documents with new user ID: ${newCount}`);
            console.log('');
        }

        // Print summary
        console.log('='.repeat(60));
        console.log('MIGRATION SUMMARY');
        console.log('='.repeat(60));
        let totalFound = 0;
        let totalModified = 0;
        
        for (const [collection, counts] of Object.entries(results)) {
            console.log(`${collection}:`);
            console.log(`  Found: ${counts.found}, Modified: ${counts.modified}`);
            totalFound += counts.found;
            totalModified += counts.modified;
        }
        
        console.log('');
        console.log(`Total documents found: ${totalFound}`);
        console.log(`Total documents modified: ${totalModified}`);
        console.log('='.repeat(60));

        if (totalModified === totalFound && totalModified > 0) {
            console.log('✓ Migration completed successfully!');
        } else if (totalFound === 0) {
            console.log('No documents found to migrate.');
        } else {
            console.log('⚠ Warning: Some documents may not have been updated!');
        }

    } catch (error) {
        console.error('Error during migration:', error);
        throw error;
    } finally {
        await client.close();
        console.log('');
        console.log('MongoDB connection closed');
    }
}

// Run the migration
migrateUserId()
    .then(() => {
        console.log('Migration script completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration script failed:', error);
        process.exit(1);
    });

