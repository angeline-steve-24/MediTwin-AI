/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged as onFirebaseAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/config';
import { AuthUser, UserRole, User, StoredUserCredential } from '../models/types';
import { AuthSession, IAuthService, LoginParams, SignUpParams } from './authInterface';
import { generateSalt, hashPassword, verifyPassword } from '../utils/crypto';
import { dataService } from './localStorageDataService';
import { demoService, DEMO_PATIENT_EMAIL, DEMO_DOCTOR_EMAIL, DEMO_PASSWORD } from './demoService';

export class AuthenticationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

// In-memory memory-store for Node environments or private browsing
const memoryStorage: Record<string, string> = {};

function getStorageItem(key: string): string | null {
  if (typeof localStorage !== 'undefined') {
    try {
      return localStorage.getItem(key);
    } catch {
      return memoryStorage[key] || null;
    }
  }
  return memoryStorage[key] || null;
}

function setStorageItem(key: string, value: string): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(key, value);
      return;
    } catch {
      memoryStorage[key] = value;
      return;
    }
  }
  memoryStorage[key] = value;
}

function removeStorageItem(key: string): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(key);
    } catch {}
  }
  delete memoryStorage[key];
}

/**
 * Maps raw Firebase Auth errors into clear, actionable, user-friendly messages.
 */
function mapFirebaseAuthError(error: any): AuthenticationError {
  const code = error?.code || 'auth/unknown';
  let message = error?.message || 'Authentication failed. Please try again.';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      message = 'Invalid email or password. Please verify your credentials and try again.';
      break;
    case 'auth/email-already-in-use':
      message = 'An account with this email address already exists. Please sign in instead.';
      break;
    case 'auth/weak-password':
      message = 'Password is too weak. Please use at least 6 characters.';
      break;
    case 'auth/invalid-email':
      message = 'The email address is invalid. Please enter a valid email format (e.g. name@example.com).';
      break;
    case 'auth/popup-closed-by-user':
      message = 'Sign-in popup was closed before completion. Please try again.';
      break;
    case 'auth/cancelled-popup-request':
      message = 'Sign-in cancelled due to multiple simultaneous popups.';
      break;
    case 'auth/popup-blocked':
      message = 'The sign-in popup was blocked by your browser. Please allow popups for this site.';
      break;
    case 'auth/too-many-requests':
      message = 'Access temporarily disabled due to too many failed attempts. Please try again later or reset your password.';
      break;
    default:
      if (message.includes('Firebase:')) {
        message = message.replace(/^Firebase:\s*/, '').replace(/\s*\([a-z0-9/-]+\)\.?$/i, '');
      }
      break;
  }

  return new AuthenticationError(message, code);
}

export class FirebaseAuthService implements IAuthService {
  private static readonly CREDENTIALS_KEY = 'meditwin_auth_credentials';
  private static readonly SESSION_KEY = 'meditwin_firebase_auth_session';
  private cachedUser: AuthUser | null = null;
  private listeners: Array<(user: AuthUser | null) => void> = [];

  constructor() {
    // 1. Ensure demo accounts are prepared
    demoService.ensureDemoAccounts().catch(() => {});

    // 2. Restore session from storage cache initially for instant UI hydration
    const cached = getStorageItem(FirebaseAuthService.SESSION_KEY);
    if (cached) {
      try {
        const session = JSON.parse(cached) as AuthSession;
        if (new Date(session.expiresAt) > new Date()) {
          this.cachedUser = session.user;
        }
      } catch {
        // ignore invalid cache
      }
    }

    // 3. Subscribe to Firebase Auth state for real-time token tracking
    onFirebaseAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        try {
          const authUser = await this.resolveAuthUser(fbUser);
          this.cachedUser = authUser;
          this.saveSession(authUser);
          this.notifyListeners(authUser);
        } catch (err) {
          console.warn('Error resolving user from Firebase:', err);
          this.notifyListeners(this.cachedUser);
        }
      } else {
        const currentSession = this.getStoredSession();
        if (currentSession?.token?.startsWith('fb_auth_')) {
          this.cachedUser = null;
          removeStorageItem(FirebaseAuthService.SESSION_KEY);
          this.notifyListeners(null);
        }
      }
    });
  }

  private getStoredCredentials(): Record<string, StoredUserCredential> {
    const raw = getStorageItem(FirebaseAuthService.CREDENTIALS_KEY);
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  private saveStoredCredentials(creds: Record<string, StoredUserCredential>): void {
    setStorageItem(FirebaseAuthService.CREDENTIALS_KEY, JSON.stringify(creds));
  }

  private getStoredSession(): AuthSession | null {
    const raw = getStorageItem(FirebaseAuthService.SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  }

  private saveSession(authUser: AuthUser): void {
    const session: AuthSession = {
      token: 'fb_session_' + authUser.id,
      user: authUser,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    setStorageItem(FirebaseAuthService.SESSION_KEY, JSON.stringify(session));
  }

  /**
   * Resolves the full AuthUser model from Firestore /users/{uid} document.
   */
  private async resolveAuthUser(fbUser: FirebaseUser, defaultRole: UserRole = 'PATIENT'): Promise<AuthUser> {
    const userDocRef = doc(db, 'users', fbUser.uid);
    let role: UserRole = defaultRole;
    let name: string = fbUser.displayName || fbUser.email?.split('@')[0] || 'User';

    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data();
        role = (data.role as UserRole) || defaultRole;
        name = data.name || name;
      } else {
        // Create user document in Firestore if not present yet
        const now = new Date().toISOString();
        const userDoc: User = {
          id: fbUser.uid,
          name: name.trim(),
          email: (fbUser.email || '').toLowerCase().trim(),
          role,
          createdAt: now,
        };
        await setDoc(userDocRef, userDoc);
      }
    } catch (err) {
      console.warn('Could not read user profile from Firestore, using defaults:', err);
    }

    const authUser: AuthUser = {
      id: fbUser.uid,
      name,
      email: (fbUser.email || '').toLowerCase(),
      role,
    };

    // Keep dataService synchronized
    try {
      await dataService.saveUser({
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        role: authUser.role,
        createdAt: new Date().toISOString(),
      });
    } catch {
      // ignore non-fatal
    }

    return authUser;
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (this.cachedUser) return this.cachedUser;
    const session = this.getStoredSession();
    if (session && new Date(session.expiresAt) > new Date()) {
      this.cachedUser = session.user;
      return this.cachedUser;
    }
    const fbUser = auth.currentUser;
    if (fbUser) {
      this.cachedUser = await this.resolveAuthUser(fbUser);
      return this.cachedUser;
    }
    return null;
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    const user = await this.getCurrentUser();
    if (!user) return null;
    return {
      token: 'fb_session_' + user.id,
      user,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  async signUp(params: SignUpParams): Promise<AuthUser> {
    const { name, email, password, confirmPassword, role } = params;

    // 1. Rigorous input validation
    if (!name?.trim()) {
      throw new AuthenticationError('Full Name is required.', 'auth/missing-name');
    }
    if (!email?.trim()) {
      throw new AuthenticationError('Email address is required.', 'auth/missing-email');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      throw new AuthenticationError('Please enter a valid email address (e.g., name@example.com).', 'auth/invalid-email');
    }
    if (!password) {
      throw new AuthenticationError('Password is required.', 'auth/missing-password');
    }
    if (password.length < 6) {
      throw new AuthenticationError('Password must be at least 6 characters long.', 'auth/weak-password');
    }
    if (password !== confirmPassword) {
      throw new AuthenticationError('Passwords do not match. Please verify both passwords.', 'auth/password-mismatch');
    }
    if (!role || (role !== 'PATIENT' && role !== 'DOCTOR')) {
      throw new AuthenticationError('Please select a valid role (Patient or Doctor).', 'auth/invalid-role');
    }

    // Check if account already exists locally
    const credentials = this.getStoredCredentials();
    const existing = Object.values(credentials).find(
      (c) => c.email.toLowerCase() === normalizedEmail
    );
    if (existing) {
      throw new AuthenticationError(
        'An account with this email address already exists. Please sign in instead.',
        'auth/email-already-in-use'
      );
    }

    let authUser: AuthUser;

    // 2. Try Firebase Auth native registration
    try {
      const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      const fbUser = credential.user;

      // Update display name in Firebase Auth
      await updateProfile(fbUser, { displayName: name.trim() });

      // Store user record in Firestore
      const userDocRef = doc(db, 'users', fbUser.uid);
      const now = new Date().toISOString();
      const userRecord: User = {
        id: fbUser.uid,
        name: name.trim(),
        email: normalizedEmail,
        role,
        createdAt: now,
      };

      try {
        await setDoc(userDocRef, userRecord);
      } catch (err) {
        console.warn('Could not write user to Firestore:', err);
      }

      // Also save to dataService
      await dataService.saveUser(userRecord);

      authUser = {
        id: fbUser.uid,
        name: name.trim(),
        email: normalizedEmail,
        role,
      };
    } catch (fbErr: any) {
      const errCode = fbErr?.code || '';

      // If Firebase Auth Password provider is not enabled in Firebase console,
      // or network offline, seamlessly register with zero-plaintext cryptographic salt + SHA-256
      if (errCode === 'auth/operation-not-allowed' || errCode === 'auth/network-request-failed' || fbErr?.message?.includes('network')) {
        console.info('Registering account with secure cryptographic credentials and Firestore persistence...');
        
        const salt = generateSalt(16);
        const passwordHash = await hashPassword(password, salt);
        const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
        const now = new Date().toISOString();

        const storedCred: StoredUserCredential = {
          id: userId,
          name: name.trim(),
          email: normalizedEmail,
          role,
          passwordHash,
          salt,
          createdAt: now,
        };

        credentials[userId] = storedCred;
        this.saveStoredCredentials(credentials);

        const userRecord: User = {
          id: userId,
          name: name.trim(),
          email: normalizedEmail,
          role,
          createdAt: now,
        };

        // Persist to Firestore
        try {
          await setDoc(doc(db, 'users', userId), userRecord);
        } catch (e) {
          console.warn('Firestore user save note:', e);
        }

        // Persist to dataService
        await dataService.saveUser(userRecord);

        authUser = {
          id: userId,
          name: name.trim(),
          email: normalizedEmail,
          role,
        };
      } else {
        throw mapFirebaseAuthError(fbErr);
      }
    }

    this.cachedUser = authUser;
    this.saveSession(authUser);
    this.notifyListeners(authUser);

    return authUser;
  }

  async login(params: LoginParams): Promise<AuthUser> {
    const { email, password } = params;

    if (!email?.trim()) {
      throw new AuthenticationError('Please enter your email address.', 'auth/missing-email');
    }
    if (!password) {
      throw new AuthenticationError('Please enter your password.', 'auth/missing-password');
    }

    const normalizedEmail = email.trim().toLowerCase();
    let authUser: AuthUser | null = null;

    // 1. Try Firebase Auth sign in
    try {
      const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const fbUser = credential.user;
      authUser = await this.resolveAuthUser(fbUser);
    } catch (fbErr: any) {
      const errCode = fbErr?.code || '';

      // If Firebase Auth password provider is not enabled or credentials stored locally/demo
      if (
        errCode === 'auth/operation-not-allowed' ||
        errCode === 'auth/invalid-credential' ||
        errCode === 'auth/user-not-found' ||
        errCode === 'auth/wrong-password' ||
        errCode === 'auth/network-request-failed'
      ) {
        // Check credentials store
        const credentials = this.getStoredCredentials();
        const cred = Object.values(credentials).find(
          (c) => c.email.toLowerCase() === normalizedEmail
        );

        if (cred) {
          const isValid = await verifyPassword(password, cred.salt, cred.passwordHash);
          if (!isValid) {
            throw new AuthenticationError('Invalid password. Please verify your credentials and try again.', 'auth/wrong-password');
          }

          authUser = {
            id: cred.id,
            name: cred.name,
            email: cred.email,
            role: cred.role,
          };

          // Try syncing to Firestore
          try {
            await setDoc(doc(db, 'users', cred.id), {
              id: cred.id,
              name: cred.name,
              email: cred.email,
              role: cred.role,
              createdAt: cred.createdAt,
            });
          } catch {
            // non-fatal
          }
        } else {
          // If demo email entered
          if (normalizedEmail === DEMO_PATIENT_EMAIL && password === DEMO_PASSWORD) {
            authUser = {
              id: 'demo_patient_angelin',
              name: 'Angelin Steve',
              email: DEMO_PATIENT_EMAIL,
              role: 'PATIENT',
            };
          } else if (normalizedEmail === DEMO_DOCTOR_EMAIL && password === DEMO_PASSWORD) {
            authUser = {
              id: 'demo_doctor_joel',
              name: 'Dr. Joel Steve',
              email: DEMO_DOCTOR_EMAIL,
              role: 'DOCTOR',
            };
          } else {
            throw new AuthenticationError('No account found with this email. Please check your email or register a new account.', 'auth/user-not-found');
          }
        }
      } else {
        throw mapFirebaseAuthError(fbErr);
      }
    }

    if (!authUser) {
      throw new AuthenticationError('Authentication failed. Please verify your credentials.', 'auth/unknown');
    }

    this.cachedUser = authUser;
    this.saveSession(authUser);
    this.notifyListeners(authUser);

    return authUser;
  }

  async signInWithGoogle(preferredRole: UserRole = 'PATIENT'): Promise<AuthUser> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      // Check if user already exists in Firestore to preserve existing role
      const userDocRef = doc(db, 'users', fbUser.uid);
      let role: UserRole = preferredRole;
      let name: string = fbUser.displayName || 'Google User';

      try {
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const data = snap.data();
          role = (data.role as UserRole) || preferredRole;
          name = data.name || name;
        } else {
          // First time sign-in with Google: create Firestore record
          const now = new Date().toISOString();
          const userDoc: User = {
            id: fbUser.uid,
            name: name.trim(),
            email: (fbUser.email || '').toLowerCase().trim(),
            role,
            createdAt: now,
          };
          await setDoc(userDocRef, userDoc);
        }
      } catch (err) {
        console.warn('Could not query Firestore during Google sign-in:', err);
      }

      const authUser: AuthUser = {
        id: fbUser.uid,
        name,
        email: (fbUser.email || '').toLowerCase(),
        role,
      };

      await dataService.saveUser({
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        role: authUser.role,
        createdAt: new Date().toISOString(),
      });

      this.cachedUser = authUser;
      this.saveSession(authUser);
      this.notifyListeners(authUser);

      return authUser;
    } catch (err: any) {
      throw mapFirebaseAuthError(err);
    }
  }

  async resetPassword(email: string): Promise<void> {
    if (!email?.trim()) {
      throw new AuthenticationError('Please enter your email address to reset your password.', 'auth/missing-email');
    }
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
    } catch (err: any) {
      if (err?.code === 'auth/operation-not-allowed') {
        console.info('Password reset requested for:', email);
        return;
      }
      throw mapFirebaseAuthError(err);
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Error during Firebase signOut:', err);
    } finally {
      this.cachedUser = null;
      removeStorageItem(FirebaseAuthService.SESSION_KEY);
      this.notifyListeners(null);
    }
  }

  async deleteAccount(userId: string): Promise<void> {
    try {
      try {
        await deleteDoc(doc(db, 'users', userId));
      } catch {
        // continue
      }

      const creds = this.getStoredCredentials();
      delete creds[userId];
      this.saveStoredCredentials(creds);

      const currentUser = auth.currentUser;
      if (currentUser && currentUser.uid === userId) {
        await currentUser.delete();
      }
    } catch (err: any) {
      console.warn('Error deleting user account:', err);
    } finally {
      await this.logout();
    }
  }

  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    this.listeners.push(callback);
    callback(this.cachedUser);

    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners(user: AuthUser | null): void {
    this.listeners.forEach((callback) => {
      try {
        callback(user);
      } catch (err) {
        console.error('Error in auth state change listener:', err);
      }
    });
  }
}

export const authService = new FirebaseAuthService();
export const LocalAuthService = FirebaseAuthService;
