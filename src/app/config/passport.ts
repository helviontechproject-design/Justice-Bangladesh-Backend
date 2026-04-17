
import passport, { Profile } from 'passport'
import {
  Strategy as GoogleStrategy,
  VerifyCallback,
} from 'passport-google-oauth20';
import { envVars } from './env';
import { UserModel } from '../modules/user/user.model';
import { ERole } from '../modules/user/user.interface';


passport.use(
  new GoogleStrategy(
    {
      clientID: envVars.GOOGLE_CLIENT_ID,
      clientSecret: envVars.GOOGLE_CLIENT_SECRET,
      callbackURL: envVars.GOOGLE_CALLBACK_URL,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback
    ) => {
      try {
        const email = profile.emails?.[0].value;

        if (!email) {
          return done(null, false, { message: 'No Email Found' });
        }

        let user = await UserModel.findOne({ email });

        const authDetails = {
          provider: 'Google',
          providerId: profile.id,
        };

        if (!user) {
          user = await UserModel.create({
            email,
            name: profile.displayName,
            picture: profile.photos?.[0].value,
            role: ERole.CLIENT,
            isVerified: true,
            auths: [authDetails],
          });
        } else {
           const isAlreadyLinked = user.auths.some(
             auth => auth.provider === authDetails.provider
           );

           if (!isAlreadyLinked) {
             user.auths.push(authDetails);
             await user.save(); 
           }
        }


        return done(null, user);
      } catch (error) {
        console.log('Google Strategy Error:', error);
        return done(error);
      }
    }
  )
);

passport.serializeUser((user: any, done: (err: any, id?: unknown) => void) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done: any) => {
  try {
    const user = await UserModel.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});
