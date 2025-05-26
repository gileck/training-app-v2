const { MongoClient } = require('mongodb');

const NEW_MONGO_URI = "mongodb+srv://gileck:jfxccnxeruiowqrioqsdjkla@cluster0.frtddwb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const DATABASES_TO_DELETE = ['daily-wellness-ai', 'daily-wellness-db'];

async function deleteDatabases() {
    let client;

    try {
        console.log('Connecting to database...');
        client = new MongoClient(NEW_MONGO_URI);
        await client.connect();

        for (const dbName of DATABASES_TO_DELETE) {
            console.log(`\nDeleting database: ${dbName}`);
            const db = client.db(dbName);
            await db.dropDatabase();
            console.log(`Successfully deleted database: ${dbName}`);
        }

    } catch (error) {
        console.error('Error deleting databases:', error);
    } finally {
        if (client) {
            await client.close();
            console.log('\nClosed database connection');
        }
    }
}

deleteDatabases(); 