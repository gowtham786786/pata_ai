const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: '../.env' }); // Ensure dotenv is loaded here

let db;
try {
    let app;
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PROJECT_ID !== 'your-firebase-project-id') {
        app = initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
            })
        });
        console.log('Firebase Admin SDK initialized with Service Account Credentials.');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        app = initializeApp({
            projectId: process.env.FIREBASE_PROJECT_ID || 'pataai',
        });
        console.log('Firebase Admin SDK initialized with ADC.');
    } else {
        throw new Error('No Service Account or ADC found, forcing mock for local dev');
    }
    
    db = getFirestore(app);
} catch (error) {
    console.log('Using Mock Firebase DB for local dev.');
    // Mock db to prevent server crashing during local hackathon demo if no credentials
    db = {
        collection: () => {
            const queryChain = {
                where: () => queryChain,
                orderBy: () => queryChain,
                limit: () => queryChain,
                get: async () => ({ forEach: (cb) => {
                    cb({ id: 'mock1', data: () => ({ originalAddress: 'Mock Address', createdAt: new Date().toISOString() }) })
                } }),
                doc: () => ({ get: async () => ({ exists: false }), set: async () => {} }),
                add: async () => ({ id: 'mock-id' }),
                set: async () => {}
            };
            return queryChain;
        },
        runTransaction: async (cb) => { await cb({ get: async () => ({ exists: false }), update: () => {}, set: () => {} }) }
    };
}

module.exports = { db };
