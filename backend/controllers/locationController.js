const axios = require('axios');
const { generateHash } = require('../utils/cryptoUtils');
const { db } = require('../firebase/firebase');

const locateAddress = async (req, res, next) => {
    try {
        const { address, forceSource } = req.body;
        const userId = req.user ? req.user.uid : 'anonymous';
        
        if (!address) {
            return res.status(400).json({ success: false, message: 'Address is required' });
        }

        const startTime = Date.now();
        // Include forceSource in hash so overriding bypasses the old cache
        const addressHash = generateHash(address + (forceSource || ''));

        // 1. Check Cache
        const cacheRef = db.collection('cache').doc(addressHash);
        let cacheDoc = null;
        try {
            console.log("Checking cache...");
            cacheDoc = await cacheRef.get();
        } catch (err) {
            console.error("Cache read error (Quota Exceeded?):", err.message);
        }

        if (cacheDoc && cacheDoc.exists) {
            const data = cacheDoc.data();
            return res.status(200).json({
                success: true,
                source: 'cache',
                data: data,
                processingTime: Date.now() - startTime
            });
        }

        console.log("Calling AI service...");
        // 2. Call AI Service (Python FastAPI)
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
        let aiResponse;
        
        try {
            const response = await axios.post(`${aiServiceUrl}/api/v1/geocode`, { 
                address,
                force_source: forceSource || null
            });
            aiResponse = response.data;
        } catch (error) {
            console.error('AI Service Error:', error.message);
            return res.status(502).json({ success: false, message: 'Failed to process address via AI service.' });
        }
        
        console.log("AI service returned:", aiResponse.confidence);

        // 2.5 Check for Conflict
        if (aiResponse.status === 'conflict') {
            return res.status(409).json({
                success: false,
                isConflict: true,
                conflictDetails: aiResponse.conflictDetails
            });
        }

        const processingTime = Date.now() - startTime;
        console.log("Saving to search history...");

        const mapsLink = `https://maps.google.com/?q=${aiResponse.latitude},${aiResponse.longitude}`;

        // 3. Save to Firebase (search_history Collection)
        const addressData = {
            originalAddress: address,
            normalizedAddress: aiResponse.normalizedAddress,
            latitude: aiResponse.latitude,
            longitude: aiResponse.longitude,
            locationSource: aiResponse.locationSource || 'Unknown',
            explanation: aiResponse.explanation || '',
            confidence: aiResponse.confidence,
            status: aiResponse.confidence === 'High' ? 'Resolved' : 'Review_Needed',
            evidence: aiResponse.evidence || [],
            agentSteps: aiResponse.agentSteps || [],
            nearbyLandmarks: aiResponse.nearbyLandmarks || [],
            maps_link: mapsLink,
            processingTime,
            timestamp: Date.now(),
            createdAt: new Date().toISOString(),
            userId: userId
        };
        let addressDocRef = { id: 'fallback-' + Date.now() };
        try {
            // Write to search_history
            addressDocRef = await db.collection('search_history').add(addressData);

            // Extract exact fields for the new geocode_logs collection
            // original_address, corrected_address, latitude, longitude, pincode, locality, district, state, confidence_score, confidence_level (High/Med/Low), timestamp, processing_time_ms
            
            // Try to extract these from aiResponse's parsed entities, since they exist there. 
            // If they are missing, use what we have or empty strings.
            const parsed = aiResponse.parsed_entities || {};
            
            const geocodeLogData = {
                original_address: address,
                corrected_address: aiResponse.normalizedAddress,
                latitude: aiResponse.latitude,
                longitude: aiResponse.longitude,
                pincode: parsed.pincode || '',
                locality: parsed.locality || parsed.village || '',
                district: parsed.district || '',
                state: parsed.state || '',
                confidence_score: aiResponse.confidence_score || 0,
                confidence_level: aiResponse.confidence,
                timestamp: Date.now(),
                processing_time_ms: processingTime
            };
            
            await db.collection('geocode_logs').add(geocodeLogData);

            // 4. Update Cache (Only if Confidence is High or Medium)
            if (['High', 'Medium'].includes(aiResponse.confidence)) {
                await cacheRef.set({
                    addressHash,
                    originalAddress: address,
                    latitude: aiResponse.latitude,
                    longitude: aiResponse.longitude,
                    locationSource: aiResponse.locationSource || 'Unknown',
                    explanation: aiResponse.explanation || '',
                    confidence: aiResponse.confidence,
                    createdAt: new Date().toISOString()
                });
            }

            // 5. Create Audit Log
            await db.collection('audit_logs').add({
                originalAddress: address,
                correctedAddress: aiResponse.normalizedAddress,
                reason: `Geocoded with ${aiResponse.confidence} confidence`,
                timestamp: new Date().toISOString(),
                userId: userId
            });
        } catch (fbError) {
            console.error('Firebase DB Error (Quota Exceeded?):', fbError.message);
            // Fallback: Continue without saving to Firebase
        }

        console.log("Updating analytics...");
        // 6. Update Analytics via Transaction
        // const analyticsRef = db.collection('analytics').doc('global_stats');
        // try {
        //     await db.runTransaction(async (transaction) => {
        //         const analyticsDoc = await transaction.get(analyticsRef);
                
        //         let stats = {
        //             totalRequests: 0,
        //             highConfidenceCount: 0,
        //             lowConfidenceCount: 0,
        //             averageResponseTime: 0
        //         };

        //         if (analyticsDoc.exists) {
        //             stats = analyticsDoc.data();
        //         }

        //         const newTotal = (stats.totalRequests || 0) + 1;
        //         const newHigh = (stats.highConfidenceCount || 0) + (aiResponse.confidence === 'High' ? 1 : 0);
        //         const newLow = (stats.lowConfidenceCount || 0) + (aiResponse.confidence === 'Low' ? 1 : 0);
                
        //         // Moving average for response time
        //         const prevTotalTime = (stats.totalRequests || 0) * (stats.averageResponseTime || 0);
        //         const newAverage = (prevTotalTime + processingTime) / newTotal;

        //         transaction.set(analyticsRef, {
        //             totalRequests: newTotal,
        //             highConfidenceCount: newHigh,
        //             lowConfidenceCount: newLow,
        //             averageResponseTime: newAverage,
        //             lastUpdated: new Date().toISOString()
        //         }, { merge: true });
        //     });
        // } catch (analyticsError) {
        //     console.error('Error updating analytics:', analyticsError.message);
        //     // Don't fail the request if analytics update fails
        // }

        console.log("Returning response...");
        // 7. Return Response
        res.status(200).json({
            success: true,
            source: 'ai_service',
            data: addressData,
            addressId: addressDocRef.id,
            candidates: aiResponse.candidates || [],
            parsedEntities: aiResponse.parsedEntities || {}
        });

    } catch (error) {
        next(error);
    }
};

const getHistory = async (req, res, next) => {
    try {
        // Normally, this would extract userId from decoded token via authMiddleware
        const userId = req.query.userId || req.body.userId; 
        
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const snapshot = await db.collection('search_history')
            .where('userId', '==', userId)
            .get();

        const history = [];
        snapshot.forEach(doc => {
            history.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort in memory to avoid needing a composite index in Firestore
        history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const limitedHistory = history.slice(0, 50);

        res.status(200).json({ success: true, count: limitedHistory.length, data: limitedHistory });
    } catch (error) {
        next(error);
    }
};

const getDashboardStats = async (req, res, next) => {
    try {
        // In a real app, verify admin role here
        const snapshot = await db.collection('search_history').get();
        
        let totalRequests = 0;
        let highConfidence = 0;
        let mediumConfidence = 0;
        let lowConfidence = 0;
        let totalProcessingTime = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            totalRequests++;
            totalProcessingTime += (data.processingTime || 0);
            
            if (data.confidence === 'High') highConfidence++;
            else if (data.confidence === 'Medium') mediumConfidence++;
            else lowConfidence++;
        });

        const avgProcessingTime = totalRequests > 0 ? (totalProcessingTime / totalRequests).toFixed(2) : 0;

        res.status(200).json({
            success: true,
            data: {
                totalRequests,
                breakdown: {
                    high: highConfidence,
                    medium: mediumConfidence,
                    low: lowConfidence
                },
                avgProcessingTimeMs: avgProcessingTime
            }
        });
    } catch (error) {
        next(error);
    }
};

const checkCache = async (req, res, next) => {
    try {
        const { address } = req.body;
        const addressHash = generateHash(address);
        const cacheDoc = await db.collection('cache').doc(addressHash).get();

        if (cacheDoc.exists) {
            res.status(200).json({ success: true, cached: true, data: cacheDoc.data() });
        } else {
            res.status(200).json({ success: true, cached: false });
        }
    } catch (error) {
        next(error);
    }
};

// 5. Submit Feedback (Self-Improving Loop)
const submitFeedback = async (req, res) => {
    try {
        const { original_address, was_correct, corrected_latitude, corrected_longitude, landmark_text, pincode } = req.body;
        const userId = req.user ? req.user.uid : 'anonymous';

        if (was_correct === false && corrected_latitude && corrected_longitude) {
            const correctionData = {
                original_address: original_address || '',
                wrong_geocode: null,
                corrected_geocode: { lat: corrected_latitude, lon: corrected_longitude },
                landmark_text: landmark_text || '',
                pincode: pincode || '',
                corrected_by: userId,
                timestamp: Date.now(),
                status: 'verified'
            };

            await db.collection('corrections').add(correctionData);
        }

        res.status(200).json({ success: true, message: 'Feedback processed successfully' });
    } catch (error) {
        console.error('Feedback Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to process feedback' });
    }
};

// 6. Get Geocode Logs for Heatmap
const getGeocodeLogs = async (req, res) => {
    try {
        const logsRef = db.collection('geocode_logs');
        const snapshot = await logsRef.orderBy('timestamp', 'desc').limit(500).get();
        
        const logs = [];
        snapshot.forEach(doc => {
            logs.push({ id: doc.id, ...doc.data() });
        });
        
        res.status(200).json({ success: true, data: logs });
    } catch (error) {
        console.error('Error fetching geocode logs:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch geocode logs' });
    }
};

// 7. Get Recent Corrections for Audit Feed
const getCorrections = async (req, res) => {
    try {
        const correctionsRef = db.collection('corrections');
        const snapshot = await correctionsRef.orderBy('timestamp', 'desc').limit(20).get();
        
        const corrections = [];
        snapshot.forEach(doc => {
            corrections.push({ id: doc.id, ...doc.data() });
        });
        
        res.status(200).json({ success: true, data: corrections });
    } catch (error) {
        console.error('Error fetching corrections:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch corrections' });
    }
};

module.exports = {
    locateAddress,
    getHistory,
    getDashboardStats,
    checkCache,
    submitFeedback,
    getGeocodeLogs,
    getCorrections
};
