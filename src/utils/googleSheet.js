export const fetchVocabFromSheet = async (scriptUrl) => {
    try {
        const response = await fetch(scriptUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();

        // Basic Validation
        if (!Array.isArray(data)) {
            throw new Error('Invalid data format: Expected an array');
        }

        // Validate first item structure
        if (data.length > 0) {
            const firstItem = data[0];
            if (!firstItem.hasOwnProperty('session') || !firstItem.hasOwnProperty('en') || !firstItem.hasOwnProperty('th')) {
                throw new Error('Invalid data format: Missing required fields (session, en, th)');
            }
        }

        return data;
    } catch (error) {
        console.error("Google Sheet Sync Error:", error);
        throw error;
    }
};
