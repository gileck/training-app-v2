const { MongoClient } = require('mongodb');

const OLD_MONGO_URI = "mongodb+srv://gileck:EdzaigZENXq1tkmT@cluster0.yepuugh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const NEW_MONGO_URI = "mongodb+srv://gileck:jfxccnxeruiowqrioqsdjkla@cluster0.frtddwb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const DB_NAME = "trainingPlanDb";

async function copyTrainingPlanDb() {
    let oldClient, newClient;

    try {
        console.log('Connecting to old database...');
        oldClient = new MongoClient(OLD_MONGO_URI);
        await oldClient.connect();

        console.log('Connecting to new database...');
        newClient = new MongoClient(NEW_MONGO_URI);
        await newClient.connect();

        const oldDb = oldClient.db(DB_NAME);
        const newDb = newClient.db(DB_NAME);

        console.log(`\nCleaning ${DB_NAME} from new database...`);
        try {
            await newDb.dropDatabase();
            console.log(`  ✓ Successfully dropped ${DB_NAME} from new database`);
        } catch (error) {
            console.log(`  Database ${DB_NAME} doesn't exist in new database (this is fine)`);
        }

        console.log(`\nGetting collections from old ${DB_NAME}...`);
        const collections = await oldDb.listCollections().toArray();

        if (collections.length === 0) {
            console.log('No collections found in old database');
            return;
        }

        console.log(`Found ${collections.length} collections to copy`);

        for (const collection of collections) {
            const collectionName = collection.name;
            console.log(`\nProcessing collection: ${collectionName}`);

            const oldCollection = oldDb.collection(collectionName);
            const newCollection = newDb.collection(collectionName);

            const documents = await oldCollection.find({}).toArray();
            console.log(`  Found ${documents.length} documents`);

            if (documents.length > 0) {
                console.log(`  Inserting ${documents.length} documents...`);
                await newCollection.insertMany(documents);
                console.log(`  ✓ Successfully copied ${collectionName}`);
            } else {
                console.log(`  Skipping empty collection`);
            }
        }

        console.log(`\n✓ Successfully copied all collections from ${DB_NAME}`);

    } catch (error) {
        console.error('Error copying database:', error);
    } finally {
        if (oldClient) {
            await oldClient.close();
            console.log('\nClosed old database connection');
        }
        if (newClient) {
            await newClient.close();
            console.log('Closed new database connection');
        }
    }
}

copyTrainingPlanDb(); 