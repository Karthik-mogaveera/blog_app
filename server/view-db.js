const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blog_application';

async function viewDatabase() {
  try {
    console.log(`\n======================================================`);
    console.log(`Connecting to MongoDB: ${uri}`);
    console.log(`======================================================\n`);

    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`Collections found in database "${mongoose.connection.db.databaseName}":`);
    console.table(collections.map((c, i) => ({ '#': i + 1, 'Collection Name': c.name, 'Type': c.type })));

    for (const col of collections) {
      const collection = mongoose.connection.db.collection(col.name);
      const count = await collection.countDocuments();
      console.log(`\n--- [Collection: ${col.name}] (Total documents: ${count}) ---`);
      
      const docs = await collection.find({}).limit(5).toArray();
      if (docs.length === 0) {
        console.log('  (No documents yet)');
      } else {
        docs.forEach((doc, idx) => {
          console.log(` Document #${idx + 1}:`);
          console.log(JSON.stringify(doc, null, 2));
        });
        if (count > 5) {
          console.log(`  ... and ${count - 5} more documents.`);
        }
      }
    }

    console.log(`\n======================================================`);
    console.log(`Database inspection completed successfully.`);
    console.log(`======================================================\n`);
  } catch (error) {
    console.error('Error inspecting database:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

viewDatabase();
