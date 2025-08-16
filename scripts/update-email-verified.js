const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function updateEmailVerified() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const User = mongoose.model('User', {
      email: String,
      emailVerified: Boolean,
    });
    
    // 全ユーザーのemailVerifiedをtrueに更新
    const result = await User.updateMany(
      { emailVerified: { $ne: true } },
      { $set: { emailVerified: true } }
    );
    
    console.log(`Updated ${result.modifiedCount} users`);
    
    // 確認のため全ユーザーを表示
    const users = await User.find({}, 'email emailVerified name');
    console.log('\nAll users:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.name}) - Email Verified: ${user.emailVerified}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

updateEmailVerified();