const { MongoClient } = require('mongodb');

const NEW_MONGO_URI = "mongodb+srv://gileck:jfxccnxeruiowqrioqsdjkla@cluster0.frtddwb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function checkUserStructure() {
    let client;

    try {
        console.log('Connecting to new database...');
        client = new MongoClient(NEW_MONGO_URI);
        await client.connect();

        const db = client.db('trainingPlanDb');
        const users = await db.collection('users').find({}).limit(2).toArray();

        console.log('Sample users:');
        users.forEach((user, index) => {
            console.log(`\nUser ${index + 1}:`);
            console.log('  _id:', user._id);
            console.log('  username:', user.username);
            console.log('  email:', user.email);
            console.log('  createdAt:', user.createdAt, 'type:', typeof user.createdAt);
            console.log('  updatedAt:', user.updatedAt, 'type:', typeof user.updatedAt);
            console.log('  profilePicture:', user.profilePicture);
        });

    } catch (error) {
        console.error('Error checking user structure:', error);
    } finally {
        if (client) {
            await client.close();
            console.log('\nClosed database connection');
        }
    }
}

checkUserStructure(); 