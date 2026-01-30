// Firebase configuration
export { default as app, auth, db, storage } from './config';

// Firebase authentication
export {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  onAuthChange,
} from './auth';

// Firebase collections
export * from './collections';
