const cloudinary = require('cloudinary').v2;

// Load config from environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isConfigured = cloudName && apiKey && apiSecret;

if (isConfigured) {
    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret
    });
    console.log('Cloudinary successfully configured.');
} else {
    console.warn('Cloudinary credentials missing in env variables! Using local mock storage.');
}

const fs = require('fs');
const path = require('path');

// Ensure uploads folder exists for local mock fallback
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const customUploader = {
    upload: async (fileStr, options = {}) => {
        if (!fileStr) {
            return { secure_url: '' };
        }

        // If it's already a URL, return it directly to avoid double uploading
        if (typeof fileStr === 'string' && (fileStr.startsWith('http://') || fileStr.startsWith('https://'))) {
            return { secure_url: fileStr };
        }

        if (isConfigured) {
            try {
                // If the base64 doesn't have the data URL scheme but is a raw base64 string, prepend it
                let uploadStr = fileStr;
                if (typeof fileStr === 'string' && !fileStr.startsWith('data:') && !fileStr.startsWith('http')) {
                    uploadStr = `data:image/png;base64,${fileStr}`;
                }
                const result = await cloudinary.uploader.upload(uploadStr, options);
                return result;
            } catch (error) {
                console.error('Cloudinary upload error:', error);
                throw error;
            }
        } else {
            // Fallback to local upload mock
            let base64Data = fileStr;
            let extension = 'png';

            if (typeof fileStr === 'string' && fileStr.startsWith('data:')) {
                const matches = fileStr.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-+.]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                    const mimeType = matches[1];
                    base64Data = matches[2];
                    extension = mimeType.split('/')[1] || 'png';
                    if (extension === 'jpeg') extension = 'jpg';
                }
            }

            const filename = `file_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
            const filepath = path.join(uploadsDir, filename);

            fs.writeFileSync(filepath, base64Data, 'base64');

            const PORT = process.env.PORT || 3000;
            const secure_url = `http://localhost:${PORT}/uploads/${filename}`;

            console.log(`[Local Upload Fallback] Saved file locally: ${filename} -> ${secure_url}`);

            return {
                secure_url: secure_url
            };
        }
    }
};

module.exports = {
    default: {
        uploader: customUploader,
        config: cloudinary.config
    },
    uploader: customUploader,
    config: cloudinary.config
};
