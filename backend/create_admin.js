const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config();

if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      })
    });
}

const db = getFirestore();

async function createAdmin() {
    const email = "reddygowtham397@gmail.com";
    const password = "Go*786786";
    const name = "Gowtham";

    try {
        let userRecord;
        try {
            userRecord = await getAuth().getUserByEmail(email);
            console.log("User already exists in Auth. Updating password...");
            await getAuth().updateUser(userRecord.uid, { password });
        } catch (e) {
            console.log("Creating new user in Auth...");
            userRecord = await getAuth().createUser({
                email,
                password,
                displayName: name,
            });
        }

        console.log(`Successfully created/updated user in Auth: ${userRecord.uid}`);

        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            name: name,
            email: email,
            role: 'admin',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        }, { merge: true });

        console.log(`Successfully assigned 'admin' role in Firestore for ${email}`);
        process.exit(0);
    } catch (error) {
        console.error("Error creating admin:", error);
        process.exit(1);
    }
}

createAdmin();
