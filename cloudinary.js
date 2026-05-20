const fs = require('fs');
const path = require('path');

// Ensure uploads folder exists in backend directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const mockCloudinary = {
    uploader: {
        upload: async (fileStr, options = {}) => {
            if (!fileStr) {
                return { secure_url: '' };
            }

            // If it's already a URL, return it directly
            if (typeof fileStr === 'string' && (fileStr.startsWith('http://') || fileStr.startsWith('https://'))) {
                return { secure_url: fileStr };
            }

            let base64Data = fileStr;
            let extension = 'png'; // default fallback

            if (typeof fileStr === 'string' && fileStr.startsWith('data:')) {
                const matches = fileStr.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-+.]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                    const mimeType = matches[1];
                    base64Data = matches[2];
                    extension = mimeType.split('/')[1] || 'png';
                    // Clean up extension names (e.g. jpeg -> jpg)
                    if (extension === 'jpeg') extension = 'jpg';
                }
            }

            const filename = `file_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
            const filepath = path.join(uploadsDir, filename);

            fs.writeFileSync(filepath, base64Data, 'base64');

            const PORT = process.env.PORT || 3000;
            const secure_url = `http://localhost:${PORT}/uploads/${filename}`;

            console.log(`[Local Upload] Saved file locally: ${filename} -> ${secure_url}`);

            return {
                secure_url: secure_url
            };
        }
    }
};

// Support both commonjs require and ES/default-like require imports
module.exports = {
    default: mockCloudinary,
    uploader: mockCloudinary.uploader,
    config: () => {}
};
