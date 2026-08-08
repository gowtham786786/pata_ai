const admin = require('firebase-admin');
require('dotenv').config();

// Check if Firebase admin is already initialized
if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      })
    });
}

const db = admin.firestore();

async function createAdmin() {
    const email = "reddygowtham397@gmail.com";
    const password = "Go*786786";
    const name = "Gowtham";

    try {
        let userRecord;
        try {
            // Check if user already exists
            userRecord = await admin.auth().getUserByEmail(email);
            console.log("User already exists in Auth. Updating password...");
            await admin.auth().updateUser(userRecord.uid, { password });
        } catch (e) {
            // User doesn't exist, create them
            console.log("Creating new user in Auth...");
            userRecord = await admin.auth().createUser({
                email,
                password,
                displayName: name,
            });
        }

        console.log(`Successfully created/updated user in Auth: ${userRecord.uid}`);

        // Set role to 'admin' in Firestore
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
