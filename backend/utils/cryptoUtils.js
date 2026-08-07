const crypto = require('crypto');

const generateHash = (text) => {
    return crypto.createHash('sha256').update(text.toLowerCase().trim()).digest('hex');
};

module.exports = {
    generateHash
};
