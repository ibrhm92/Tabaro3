import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ======================================
//  ضع إعدادات Firebase الخاصة بك هنا
// ======================================
const firebaseConfig = {
  apiKey: "AIzaSyCKkG11JFHcvA4dt8iPvUC6Wr__IK9ddRQ",
  authDomain: "tabaro3-5d40d.firebaseapp.com",
  projectId: "tabaro3-5d40d",
  storageBucket: "tabaro3-5d40d.firebasestorage.app",
  messagingSenderId: "636315752276",
  appId: "1:636315752276:web:4c874c792754bd2a66dac1",
  measurementId: "G-VVHJBDWKFS"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
