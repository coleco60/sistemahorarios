// firebase.js

// 1. Importe a biblioteca de autenticação do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { 
    getDatabase, 
    ref as dbRef, 
    push as dbPush,
    set as dbSet,
    onValue as dbOnValue,
    remove as dbRemove,
    update as dbUpdate,
    serverTimestamp as dbServerTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

// Importe AGORA as funções específicas do Firebase Authentication
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js"; // <--- NOVIDADE AQUI!

const firebaseConfig = {
    apiKey: "AIzaSyBKVphDXSCKgJ0onyebhD2FQ_gK5fALQhg",
    authDomain: "sistemahorarios-de981.firebaseapp.com",
    projectId: "sistemahorarios-de981",
    storageBucket: "sistemahorarios-de981.appspot.com",
    messagingSenderId: "647390917543",
    appId: "1:647390917543:web:848a6f24bf012260407c82"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Inicialize o Realtime Database
const firebaseDB = getDatabase(app);

// <--- NOVIDADE AQUI! Inicialize o Firebase Authentication --->
const firebaseAuth = getAuth(app); 

// Disponibiliza as funções do Realtime Database no escopo global
window.firebaseDB = firebaseDB;
window.dbRef = dbRef;
window.dbPush = dbPush;
window.dbSet = dbSet;
window.dbOnValue = dbOnValue;
window.dbRemove = dbRemove;
window.dbUpdate = dbUpdate;
window.dbServerTimestamp = dbServerTimestamp;

// <--- NOVIDADE AQUI! Disponibiliza as funções do Firebase Authentication no escopo global --->
window.firebaseAuth = firebaseAuth; // A instância do Auth
window.authCreateUserWithEmailAndPassword = createUserWithEmailAndPassword;
window.authSignInWithEmailAndPassword = signInWithEmailAndPassword;
window.authSignOut = signOut;
window.authOnAuthStateChanged = onAuthStateChanged;
window.authGoogleAuthProvider = GoogleAuthProvider; // O provedor do Google
window.authSignInWithPopup = signInWithPopup;

console.log("Firebase e Firebase Authentication configurados com sucesso! Funções disponíveis globalmente.");
