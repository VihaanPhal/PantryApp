// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.GOOGLE_API_KEY,
  authDomain: "pantryapp-dff4d.firebaseapp.com",
  projectId: "pantryapp-dff4d",
  storageBucket: "pantryapp-dff4d.appspot.com",
  messagingSenderId: "451621684641",
  appId: "1:451621684641:web:fa9fb0ca6341519bebf7e0",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
export { app, firestore };
