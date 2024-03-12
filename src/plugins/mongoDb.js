const { MongoClient } = require("mongodb");
require('dotenv').config()

const connectToCluster = async (uri) => {
    let mongoClient;
 
    try {
        mongoClient = new MongoClient(uri);
        console.log('Connecting to MongoDB Atlas cluster...');
        await mongoClient.connect();
        console.log('Successfully connected to MongoDB Atlas!');
 
        return mongoClient;
    } catch (error) {
        console.error('Connection to MongoDB Atlas failed!', error);
        process.exit();
    }
 }

const getCollection = async (collectionName) => {
	const uri = process.env.DB_URI;
	let mongoClient;

	try {
        mongoClient = await connectToCluster(uri);
        const db = mongoClient.db(process.env.DB_NAME);
        // const collection = db.collection(collectionName);
        // collection.drop();
        return db.collection(collectionName);
    } catch(error) {
        console.info('mongoClient connectoion error,', error);
    }
}

const insertRows = async ({
    result,
    collectionName,
    columnHeaders
}) => {
    const collection = await getCollection(collectionName);
    result?.data?.forEach(async item => {
        const document = {};

        item.map( (element, elementIdx) =>{
            document[columnHeaders[elementIdx]] = element;
        })

        await collection.insertOne(document);     
    });
    
    return;
}

module.exports = {
	insertRows
};
