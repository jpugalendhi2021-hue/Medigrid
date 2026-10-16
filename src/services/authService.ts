import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  FirebaseUser,
} from '../lib/firebase';

export interface AuthResult {
  user: FirebaseUser;
  isNewUser?: boolean;
}

/**
 * Sign in with Google using Firebase Authentication popup
 */
export async function loginWithGoogle(): Promise<FirebaseUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('[Firebase Auth] Google Sign In Error:', error);
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in cancelled. Please try again.');
    } else if (error.code === 'auth/unauthorized-domain') {
      throw new Error('This domain is not authorized in Firebase Console -> Authentication -> Settings -> Authorized domains.');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked by the browser. Please allow popups for this site.');
    }
    throw new Error(error.message || 'Failed to authenticate with Google');
  }
}

/**
 * Sign in with Email and Password using Firebase Auth
 */
export async function loginWithEmail(email: string, pass: string): Promise<FirebaseUser> {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error: any) {
    console.error('[Firebase Auth] Email Login Error:', error);
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      throw new Error('Invalid email or password. Please verify credentials.');
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Email/Password sign-in is not enabled in Firebase Console. You can use Google Sign-In or enable Email/Password provider in the Firebase Authentication console.');
    }
    throw new Error(error.message || 'Failed to sign in with email');
  }
}

/**
 * Register a new user with Email and Password
 */
export async function registerWithEmail(email: string, pass: string, name: string): Promise<FirebaseUser> {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (name) {
      await updateProfile(result.user, { displayName: name });
    }
    return result.user;
  } catch (error: any) {
    console.error('[Firebase Auth] Registration Error:', error);
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('An account already exists with this email address.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password should be at least 6 characters.');
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Email/Password provider is disabled. Please enable it in Firebase Console or use Google Sign-In.');
    }
    throw new Error(error.message || 'Registration failed');
  }
}

/**
 * Send password reset email
 */
export async function sendResetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('[Firebase Auth] Password Reset Error:', error);
    throw new Error(error.message || 'Failed to dispatch password recovery email');
  }
}

/**
 * Sign out from Firebase Authentication
 */
export async function logoutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('[Firebase Auth] Logout Error:', error);
    throw error;
  }
}
