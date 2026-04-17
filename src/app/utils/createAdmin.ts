import bcryptjs from 'bcryptjs';
import { UserModel } from '../modules/user/user.model';
import { envVars } from '../config/env';
import {
  IAuthProvider,
  ERole,
  EIsActive,
} from '../modules/user/user.interface';

export const createAdmin = async () => {
  try {
    const isAdminExist = await UserModel.findOne({
      email: envVars.ADMIN_EMAIL,
    });

    if (isAdminExist) {
      console.log('Super Admin Already Exists!');
      return;
    }

    // 🌐 Auth Provider info
    const authProvider: IAuthProvider = {
      provider: 'email',
      providerId: envVars.ADMIN_EMAIL,
    };

    // 🧩 Payload as per your IUser model
    const payload = {
      email: envVars.ADMIN_EMAIL,
      phoneNo: {
        value: envVars.ADMIN_PHONE,
      },
      role: ERole.SUPER_ADMIN,
      isVerified: true,
      isActive: EIsActive.ACTIVE,
      isDeleted: false,
      auths: [authProvider],
      notifications: [],
    };

    // ✅ Create admin user
    await UserModel.create(payload);

    console.log('✅ Super Admin Created Successfully!');
  } catch (error) {
    console.error('❌ Failed to create Super Admin:', error);
  }
};
