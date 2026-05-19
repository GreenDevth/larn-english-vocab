export const fetchVocabFromSheet = async (scriptUrl, sheetName = 'VocabData') => {
    try {
        const url = `${scriptUrl}?sheetName=${encodeURIComponent(sheetName)}`;
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow' // บังคับให้เบราว์เซอร์ติดตาม 302 Redirect ไปยังหน้าที่มี CORS headers
        });
        if (!response.ok) {
            throw new Error('ไม่สามารถเข้าถึงที่อยู่ของ Google Apps Script ได้ค่ะ');
        }
        const data = await response.json();

        if (data.error) {
            throw new Error(data.message || data.error);
        }

        if (!Array.isArray(data)) {
            throw new Error('รูปแบบข้อมูลคำศัพท์ไม่ถูกต้อง: คาดหวังข้อมูลแบบ Array ค่ะ');
        }

        if (data.length > 0) {
            const firstItem = data[0];
            if (!firstItem.hasOwnProperty('session') || !firstItem.hasOwnProperty('en') || !firstItem.hasOwnProperty('th')) {
                throw new Error('โครงสร้างหัวตารางคอลัมน์ในแผ่นงานไม่ถูกต้องค่ะ (จำเป็นต้องมี: session, en, th)');
            }
        }

        return data;
    } catch (error) {
        console.error("Google Sheet Sync Error:", error);
        throw error;
    }
};

export const fetchSheetsList = async (scriptUrl) => {
    try {
        const url = `${scriptUrl}?action=getSheets`;
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow' // บังคับให้เบราว์เซอร์ติดตาม 302 Redirect ไปยังหน้าที่มี CORS headers
        });
        if (!response.ok) {
            throw new Error('ไม่สามารถดึงข้อมูลรายชื่อแผ่นงานได้ค่ะ');
        }
        const sheets = await response.json();
        
        if (sheets.error) {
            throw new Error(sheets.message || sheets.error);
        }
        
        if (!Array.isArray(sheets)) {
            throw new Error('รูปแบบข้อมูลของรายชื่อแผ่นงานไม่ถูกต้องค่ะ');
        }
        
        return sheets;
    } catch (error) {
        console.error("Google Sheet Fetch Sheets Error:", error);
        throw error;
    }
};

export const updateSheetData = async (scriptUrl, data, sheetName = 'VocabData') => {
    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', // Plain text to avoid complex preflight
            },
            body: JSON.stringify({
                sheetName: sheetName,
                data: data
            })
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Google Sheet Upload Error:", error);
        throw error;
    }
};

