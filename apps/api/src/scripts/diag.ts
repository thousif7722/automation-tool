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
    await connectDatabase(env.MONGODB_URI);
    const user = await UserModel.findOne({ email: 'shaikthousif.tech@gmail.com' }).select('+passwordHash').lean();
    if (!user) {
      console.log('---DIAG_RESULT--- USER_NOT_FOUND');
    } else {
      console.log('---DIAG_RESULT--- USER_FOUND');
      console.log('ID:', user._id.toString());
      console.log('EMAIL:', user.email);
      console.log('NAME:', user.name);
      console.log('GLOBAL_ROLE:', user.globalRole);
      console.log('HAS_HASH:', !!user.passwordHash);
      console.log('VERIFIED:', user.isEmailVerified);
    }
  } catch (err: any) {
    console.error('---DIAG_RESULT--- ERROR:', err.message);
  } finally {
    await disconnectDatabase();
  }
}

main();
