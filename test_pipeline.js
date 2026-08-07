const axios = require('axios');

async function testPipeline() {
    console.log("Starting Integration Test for Pata AI...");
    const testAddress = "opposite sbi bank, mg road, bangalore 560001";
    console.log(`Sending address: "${testAddress}" to Orchestrator (Node.js)...`);
    
    try {
        const response = await axios.post('http://localhost:5000/api/locate', {
            address: testAddress,
            userId: 'integration-test-script'
        });
        
        console.log("\n✅ Integration Successful!");
        console.log("===========================");
        console.log(JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error("\n❌ Integration Failed!");
        console.error(error.response ? error.response.data : error.message);
        console.log("Ensure both the Node.js backend (port 5000) and Python AI service (port 8000) are running.");
    }
}

testPipeline();
