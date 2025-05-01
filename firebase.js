// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCVsUF-ZT_8lrRQ3fy3f4b8_5CUy0KAfJs",
  authDomain: "quizlearn-f8d05.firebaseapp.com",
  projectId: "quizlearn-f8d05",
  storageBucket: "quizlearn-f8d05.firebasestorage.app",
  messagingSenderId: "203617705229",
  appId: "1:203617705229:web:91dc07b1fa0b1467686444",
  measurementId: "G-Y8NGV2D4Q9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);