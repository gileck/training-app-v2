const { MongoClient } = require('mongodb');

const OLD_MONGO_URI = "mongodb+srv://gileck:jfxccnxeruiowqrioqsdjkla@cluster0.frtddwb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function checkOldDatabase() {
    let client;

    try {
        console.log('Connecting to old database...');
        client = new MongoClient(OLD_MONGO_URI);
        await client.connect();

        console.log('Listing all databases...');
        const adminDb = client.db().admin();
        const databases = await adminDb.listDatabases();

        console.log('Available databases:');
        databases.databases.forEach(db => {
            console.log(`- ${db.name}`);
        });

        for (const dbInfo of databases.databases) {
            if (dbInfo.name !== 'admin' && dbInfo.name !== 'local' && dbInfo.name !== 'config') {
                console.log(`\nChecking collections in database: ${dbInfo.name}`);
                const db = client.db(dbInfo.name);
                const collections = await db.listCollections().toArray();

                if (collections.length === 0) {
                    console.log('  No collections found');
                } else {
                    for (const collection of collections) {
                        const count = await db.collection(collection.name).countDocuments();
                        console.log(`  - ${collection.name} (${count} documents)`);
                    }
                }
            }
        }

    } catch (error) {
        console.error('Error checking old database:', error);
    } finally {
        if (client) {
            await client.close();
            console.log('\nClosed database connection');
        }
    }
}

checkOldDatabase(); 