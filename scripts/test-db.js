const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function testDB() {
  try {
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully');
    
    // データベース名を確認
    const dbName = mongoose.connection.db.databaseName;
    console.log('Database name:', dbName);
    
    // コレクション一覧を取得
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // 直接クエリでユーザーを確認
    const usersCollection = mongoose.connection.db.collection('users');
    const userCount = await usersCollection.countDocuments();
    console.log('Total users in collection:', userCount);
    
    const users = await usersCollection.find({}).toArray();
    console.log('Users found:', users);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testDB();