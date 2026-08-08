import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDM4gHV0BarWTYQ8fuINznZZkc5R1FSLy4",
  authDomain: "pataai-v2.firebaseapp.com",
  projectId: "pataai-v2",
  storageBucket: "pataai-v2.firebasestorage.app",
  messagingSenderId: "1000534390193",
  appId: "1:1000534390193:web:38c0dc53a080913fb07990",
  measurementId: "G-72QFNLG700"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function test() {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, "reddygowtham397@gmail.com", "Go*786786");
    console.log("SUCCESS:", userCredential.user.uid);
  } catch (error) {
    console.error("ERROR:", error.code, error.message);
  }
}

test();
