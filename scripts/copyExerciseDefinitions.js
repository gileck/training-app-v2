const { MongoClient } = require('mongodb');

const OLD_MONGO_URI = "mongodb+srv://gileck:EdzaigZENXq1tkmT@cluster0.yepuugh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const NEW_MONGO_URI = "mongodb+srv://gileck:jfxccnxeruiowqrioqsdjkla@cluster0.frtddwb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const DATABASE_NAME = "trainingPlanDb";
const COLLECTION_NAME = "exerciseDefinitions";

async function copyExerciseDefinitions() {
    let oldClient, newClient;

    try {
        console.log('Connecting to old database...');
        oldClient = new MongoClient(OLD_MONGO_URI);
        await oldClient.connect();

        console.log('Connecting to new database...');
        newClient = new MongoClient(NEW_MONGO_URI);
        await newClient.connect();

        const oldDb = oldClient.db(DATABASE_NAME);
        const newDb = newClient.db(DATABASE_NAME);

        const oldCollection = oldDb.collection(COLLECTION_NAME);
        const newCollection = newDb.collection(COLLECTION_NAME);

        console.log('Fetching documents from old database...');
        const documents = await oldCollection.find({}).toArray();

        console.log(`Found ${documents.length} exercise definitions to copy`);

        if (documents.length === 0) {
            console.log('No documents to copy');
            return;
        }

        console.log('Checking if new collection already has documents...');
        const existingCount = await newCollection.countDocuments();

        if (existingCount > 0) {
            console.log(`Warning: New collection already has ${existingCount} documents`);
            console.log('Clearing existing documents...');
            await newCollection.deleteMany({});
        }

        console.log('Inserting documents into new database...');
        const result = await newCollection.insertMany(documents);

        console.log(`Successfully copied ${result.insertedCount} exercise definitions`);

    } catch (error) {
        console.error('Error copying exercise definitions:', error);
        process.exit(1);
    } finally {
        if (oldClient) {
            await oldClient.close();
            console.log('Closed old database connection');
        }
        if (newClient) {
            await newClient.close();
            console.log('Closed new database connection');
        }
    }
}

copyExerciseDefinitions(); 