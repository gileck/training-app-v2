const { MongoClient } = require('mongodb');

const OLD_MONGO_URI = "mongodb+srv://gileck:jfxccnxeruiowqrioqsdjkla@cluster0.frtddwb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function checkTrainingPlans() {
    let client;

    try {
        console.log('Connecting to old database...');
        client = new MongoClient(OLD_MONGO_URI);
        await client.connect();

        const db = client.db('trainingPlanDb');
        const collection = db.collection('trainingPlans');

        console.log('Fetching training plans...');
        const trainingPlans = await collection.find({}).toArray();

        console.log(`Found ${trainingPlans.length} training plans`);

        trainingPlans.forEach((plan, index) => {
            console.log(`\nTraining Plan ${index + 1}:`);
            console.log(`  Name: ${plan.name || 'N/A'}`);
            console.log(`  Structure:`, JSON.stringify(plan, null, 2));
        });

    } catch (error) {
        console.error('Error checking training plans:', error);
    } finally {
        if (client) {
            await client.close();
            console.log('\nClosed database connection');
        }
    }
}

checkTrainingPlans(); 