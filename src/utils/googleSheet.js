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

export const updateSheetData = async (scriptUrl, data) => {
    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            // mode: 'no-cors', // REMOVED to allow reading JSON response
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', // Plain text to avoid complex preflight
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Google Sheet Upload Error:", error);
        // If it was a 'no-cors' issue, we might not see the error details, but let's assume it works.
        // If GAS returns JSON, standard fetch works.
        throw error;
    }
};
