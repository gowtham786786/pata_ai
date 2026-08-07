const axios = require('axios');
const { generateHash } = require('../utils/cryptoUtils');
const { db } = require('../firebase/firebase');

const locateAddress = async (req, res, next) => {
    try {
        const { address } = req.body;
        const userId = req.user ? req.user.uid : 'anonymous';
        
        if (!address) {
            return res.status(400).json({ success: false, message: 'Address is required' });
        }

        const startTime = Date.now();
        const addressHash = generateHash(address);

        // 1. Check Cache
        const cacheRef = db.collection('cache').doc(addressHash);
        const cacheDoc = await cacheRef.get();

        if (cacheDoc.exists) {
            const data = cacheDoc.data();
            return res.status(200).json({
                success: true,
                source: 'cache',
                data: data,
                processingTime: Date.now() - startTime
            });
        }

        // 2. Call AI Service (Python FastAPI)
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
        let aiResponse;
        
        try {
            const response = await axios.post(`${aiServiceUrl}/api/v1/geocode`, { address });
            aiResponse = response.data;
        } catch (error) {
            console.error('AI Service Error:', error.message);
            return res.status(502).json({ success: false, message: 'Failed to process address via AI service.' });
        }

        const processingTime = Date.now() - startTime;

        // 3. Save to Firebase (search_history Collection)
        const addressData = {
            originalAddress: address,
            normalizedAddress: aiResponse.normalizedAddress,
            latitude: aiResponse.latitude,
            longitude: aiResponse.longitude,
            confidence: aiResponse.confidence,
            status: aiResponse.confidence === 'High' ? 'Resolved' : 'Review_Needed',
            evidence: aiResponse.evidence || [],
            agentSteps: aiResponse.agentSteps || [],
            nearbyLandmarks: aiResponse.nearbyLandmarks || [],
            processingTime,
            timestamp: Date.now(),
            createdAt: new Date().toISOString(),
            userId: userId
        };

        const addressDocRef = await db.collection('search_history').add(addressData);

        // 4. Update Cache (Only if Confidence is High or Medium)
        if (['High', 'Medium'].includes(aiResponse.confidence)) {
            await cacheRef.set({
                addressHash,
                originalAddress: address,
                latitude: aiResponse.latitude,
                longitude: aiResponse.longitude,
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

        // 6. Update Analytics via Transaction
        const analyticsRef = db.collection('analytics').doc('global_stats');
        try {
            await db.runTransaction(async (transaction) => {
                const analyticsDoc = await transaction.get(analyticsRef);
                
                let stats = {
                    totalRequests: 0,
                    highConfidenceCount: 0,
                    lowConfidenceCount: 0,
                    averageResponseTime: 0
                };

                if (analyticsDoc.exists) {
                    stats = analyticsDoc.data();
                }

                const newTotal = (stats.totalRequests || 0) + 1;
                const newHigh = (stats.highConfidenceCount || 0) + (aiResponse.confidence === 'High' ? 1 : 0);
                const newLow = (stats.lowConfidenceCount || 0) + (aiResponse.confidence === 'Low' ? 1 : 0);
                
                // Moving average for response time
                const prevTotalTime = (stats.totalRequests || 0) * (stats.averageResponseTime || 0);
                const newAverage = (prevTotalTime + processingTime) / newTotal;

                transaction.set(analyticsRef, {
                    totalRequests: newTotal,
                    highConfidenceCount: newHigh,
                    lowConfidenceCount: newLow,
                    averageResponseTime: newAverage,
                    lastUpdated: new Date().toISOString()
                }, { merge: true });
            });
        } catch (analyticsError) {
            console.error('Error updating analytics:', analyticsError);
            // Don't fail the request if analytics update fails
        }

        // 7. Return Response
        res.status(200).json({
            success: true,
            source: 'ai_service',
            data: addressData,
            addressId: addressDocRef.id
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

        const snapshot = await db.collection('addresses')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        const history = [];
        snapshot.forEach(doc => {
            history.push({ id: doc.id, ...doc.data() });
        });

        res.status(200).json({ success: true, count: history.length, data: history });
    } catch (error) {
        next(error);
    }
};

const getDashboardStats = async (req, res, next) => {
    try {
        // In a real app, verify admin role here
        const snapshot = await db.collection('addresses').get();
        
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

module.exports = {
    locateAddress,
    getHistory,
    getDashboardStats,
    checkCache
};
