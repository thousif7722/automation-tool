import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

import { connectDatabase, disconnectDatabase, UserModel } from '@insta-automation/database';
import { getEnv } from '@insta-automation/config';

async function main() {
  try {
    const env = getEnv();
    console.log('MONGODB_URI:', env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    await connectDatabase(env.MONGODB_URI);
    const users = await UserModel.find({}).lean();
    console.log(`TOTAL_USERS_COUNT: ${users.length}`);
    users.forEach((u) => {
      console.log(`USER: id=${u._id.toString()}, email="${u.email}", role="${u.globalRole}", verified=${u.isEmailVerified}`);
    });
  } catch (err: any) {
    console.error('ERROR:', err.message);
  } finally {
    await disconnectDatabase();
  }
}

main();
