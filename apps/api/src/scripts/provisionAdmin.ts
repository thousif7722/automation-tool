import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

import { connectDatabase, disconnectDatabase, UserModel, WorkspaceModel, SubscriptionModel } from '@insta-automation/database';
import { hashPassword } from '@insta-automation/auth';
import { getEnv } from '@insta-automation/config';

async function provisionAdmin() {
  const rawEmail = process.env.ADMIN_EMAIL || process.argv[2];
  const email = rawEmail ? rawEmail.toLowerCase().trim() : '';
  const password = process.env.ADMIN_PASSWORD || process.argv[3];
  const name = process.env.ADMIN_NAME || 'Platform Owner';
  const role = (process.env.ADMIN_ROLE as 'admin' | 'superadmin') || 'superadmin';

  if (!email || !password) {
    console.error('Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables or command arguments are required.');
    console.error('Usage: ADMIN_EMAIL="admin@domain.com" ADMIN_PASSWORD="Password123!" npx ts-node src/scripts/provisionAdmin.ts');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Error: ADMIN_PASSWORD must be at least 8 characters long.');
    process.exit(1);
  }

  try {
    const env = getEnv();
    await connectDatabase(env.MONGODB_URI);
    console.log('[Provision] Connected to MongoDB database.');

    const passwordHash = await hashPassword(password);
    let user = await UserModel.findOne({ email });

    if (user) {
      user.passwordHash = passwordHash;
      user.globalRole = role;
      user.name = name;
      await user.save();
      console.log(`[Provision Success] Existing account for ${email} updated with globalRole='${role}'.`);
    } else {
      user = await UserModel.create({
        name,
        email,
        passwordHash,
        globalRole: role,
        isEmailVerified: true,
      });

      const workspace = await WorkspaceModel.create({
        name: `${name}'s Admin Workspace`,
        slug: `admin-ws-${user._id.toString().slice(-6)}`,
        ownerId: user._id,
        members: [{ userId: user._id, role: 'OWNER', joinedAt: new Date() }],
      });

      await SubscriptionModel.create({
        workspaceId: workspace._id,
        planSlug: 'agency',
        status: 'ACTIVE',
      });

      console.log(`[Provision Success] New platform administrator account created for ${email} with globalRole='${role}'.`);
    }
  } catch (err: any) {
    console.error('[Provision Fatal Error]', err.message);
    process.exit(1);
  } finally {
    await disconnectDatabase();
    console.log('[Provision] Database disconnected.');
  }
}

provisionAdmin();
