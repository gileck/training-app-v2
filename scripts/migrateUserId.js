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

        // Dynamically discover collections and migrate any that contain a userId field
        const collections = await db.listCollections().toArray();
        const results = {};

        for (const { name: collectionName } of collections) {
            if (collectionName === 'users') {
                // Never update users._id here
                continue;
            }

            const collection = db.collection(collectionName);
            console.log(`Processing collection: ${collectionName}`);

            // Count by ObjectId and by string to cover both schemas
            const oldIdAsObjectId = await collection.countDocuments({ userId: new ObjectId(OLD_USER_ID) }).catch(() => 0);
            const oldIdAsString = await collection.countDocuments({ userId: OLD_USER_ID }).catch(() => 0);

            const totalOld = oldIdAsObjectId + oldIdAsString;
            console.log(`  Found ${totalOld} documents with old user ID (ObjectId: ${oldIdAsObjectId}, String: ${oldIdAsString})`);

            let modified = 0;
            if (oldIdAsObjectId > 0) {
                const res = await collection.updateMany(
                    { userId: new ObjectId(OLD_USER_ID) },
                    { $set: { userId: new ObjectId(NEW_USER_ID) } }
                );
                modified += res.modifiedCount || 0;
            }
            if (oldIdAsString > 0) {
                const res = await collection.updateMany(
                    { userId: OLD_USER_ID },
                    { $set: { userId: NEW_USER_ID } }
                );
                modified += res.modifiedCount || 0;
            }

            results[collectionName] = { found: totalOld, modified };
            if (totalOld > 0) {
                console.log(`  ✓ Updated ${modified} documents`);
            } else {
                console.log('  No documents to update');
            }

            // Verify update (check both types)
            const remainingOldObj = await collection.countDocuments({ userId: new ObjectId(OLD_USER_ID) }).catch(() => 0);
            const remainingOldStr = await collection.countDocuments({ userId: OLD_USER_ID }).catch(() => 0);
            const newCountObj = await collection.countDocuments({ userId: new ObjectId(NEW_USER_ID) }).catch(() => 0);
            const newCountStr = await collection.countDocuments({ userId: NEW_USER_ID }).catch(() => 0);

            console.log(`  Old remaining → ObjectId: ${remainingOldObj}, String: ${remainingOldStr}`);
            console.log(`  New totals → ObjectId: ${newCountObj}, String: ${newCountStr}`);
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

