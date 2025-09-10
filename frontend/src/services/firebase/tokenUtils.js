import { auth } from './firebase';

export async function getToken() {
  try {
    const user = auth.currentUser;
    return user ? await user.getIdToken() : null;
  } catch (err) {
    return null;
  }
}
