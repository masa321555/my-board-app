const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  emailVerified: Boolean,
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
}, {
  timestamps: true,
});

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const User = mongoose.model('User', userSchema);
    
    // 特定のユーザーを検索
    const user = await User.findOne({ email: 'masaharu3210101@yahoo.co.jp' });
    
    if (user) {
      console.log('User found:');
      console.log('- Email:', user.email);
      console.log('- Name:', user.name);
      console.log('- Email Verified:', user.emailVerified);
      console.log('- Created At:', user.createdAt);
      console.log('- Password Hash:', user.password ? 'Set' : 'Not set');
    } else {
      console.log('User not found');
      
      // 全ユーザーをリスト
      const allUsers = await User.find({}, 'email emailVerified createdAt');
      console.log('\nAll users in database:');
      allUsers.forEach(u => {
        console.log(`- ${u.email} (Verified: ${u.emailVerified}, Created: ${u.createdAt})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUser();