// ========================================
// Google Apps Script for LarnVocab Kids
// เวอร์ชัน 1.3.1 - Dynamic Sheets Support (มะลิแก้ไขข้อผิดพลาด .setHeader เรียบร้อย)
// ========================================
// 
// 📌 คำแนะนำการใช้งานสำหรับเวอร์ชัน 1.3.1:
// 1. เปิด Google Sheet ของคุณ
// 2. Extensions → Apps Script
// 3. คัดลอกโค้ดนี้ทั้งหมดไปวางแทนที่โค้ดเดิม
// 4. บันทึก (Ctrl+S)
// 5. Deploy → New deployment
//    - เลือก Gear icon → Web app
//    - Execute as: "Me"
//    - Who has access: "Anyone" ⚠️ สำคัญมาก!
// 6. คลิก Deploy (หรือหากเคย Deploy แล้ว ให้เลือก Manage deployments → Edit และเลือก New version ทุกครั้ง)
//
// ========================================

const DEFAULT_SHEET_NAME = 'VocapData'; // ชื่อชีตเริ่มต้น (เปลี่ยนให้ตรงกับชีตหลักของคุณได้ค่ะ)

/**
 * ฟังก์ชันสำหรับ GET Request (ดึงข้อมูล)
 * รองรับการดึงรายชื่อแผ่นงาน และการระบุแผ่นงานที่ต้องการดึงข้อมูล
 * 
 * 📌 พารามิเตอร์ของ URL:
 * 1. action=getSheets : ดึงรายชื่อแผ่นงานทั้งหมดใน Google Sheets
 *    ตัวอย่าง: https://script.google.com/.../exec?action=getSheets
 *    ส่งกลับ: ["VocapData", "Animals", "Fruits"]
 * 
 * 2. action=fetch&sheetName=Animals หรือ ?sheetName=Animals : ดึงข้อมูลจากแผ่นงานที่ระบุ
 *    ตัวอย่าง: https://script.google.com/.../exec?sheetName=Animals
 *    ส่งกลับ: JSON Array คำศัพท์ของแผ่นงานนั้น
 */
function doGet(e) {
    try {
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        const action = e.parameter.action;

        // 🌟 CASE 1: ดึงรายชื่อแผ่นงานทั้งหมดในเอกสารนี้
        if (action === 'getSheets') {
            const allSheets = spreadsheet.getSheets().map(s => s.getName());
            return ContentService.createTextOutput(
                JSON.stringify(allSheets)
            ).setMimeType(ContentService.MimeType.JSON);
        }

        // 🌟 CASE 2: ดึงข้อมูลคำศัพท์จากแผ่นงานที่เลือก
        // ดึงชื่อชีตจาก parameter หากไม่มีให้ใช้ DEFAULT_SHEET_NAME
        const sheetName = e.parameter.sheetName || DEFAULT_SHEET_NAME;
        const sheet = spreadsheet.getSheetByName(sheetName);

        // ตรวจสอบว่ามี Sheet หรือไม่
        if (!sheet) {
            const allSheets = spreadsheet.getSheets().map(s => s.getName());
            return ContentService.createTextOutput(
                JSON.stringify({
                    error: 'Sheet not found',
                    message: `ไม่พบแผ่นงานชื่อ "${sheetName}"`,
                    availableSheets: allSheets,
                    hint: `กรุณาเลือกแผ่นงานที่มีอยู่ หรือพิมพ์สร้างแผ่นงานใหม่จากระบบ`
                })
            ).setMimeType(ContentService.MimeType.JSON);
        }

        // อ่านข้อมูลทั้งหมด
        const data = sheet.getDataRange().getValues();

        // ตรวจสอบว่ามีข้อมูลหรือไม่
        if (data.length === 0 || (data.length === 1 && data[0][0] === '')) {
            return ContentService.createTextOutput(
                JSON.stringify([]) // ส่ง empty array
            ).setMimeType(ContentService.MimeType.JSON);
        }

        if (data.length === 1) {
            return ContentService.createTextOutput(
                JSON.stringify({
                    error: 'No data',
                    message: `แผ่นงาน "${sheetName}" มีแต่ header ไม่มีข้อมูล`,
                    hint: 'กรุณาเพิ่มข้อมูลคำศัพท์ในแผ่นงานอย่างน้อย 1 แถว'
                })
            ).setMimeType(ContentService.MimeType.JSON);
        }

        const headers = data[0].map(h => h.toString().trim().toLowerCase()); // ปรับชื่อ header ให้เป็นตัวเล็กและตัดช่องว่าง
        const rows = data.slice(1); // แถวที่เหลือเป็นข้อมูล

        // ตรวจสอบ headers ขั้นต่ำ
        const requiredHeaders = ['session', 'en', 'th'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
            return ContentService.createTextOutput(
                JSON.stringify({
                    error: 'Invalid headers',
                    message: `โครงสร้างหัวตารางในแผ่นงาน "${sheetName}" ไม่ถูกต้อง ขาดคอลัมน์: ${missingHeaders.join(', ')}`,
                    currentHeaders: headers,
                    requiredHeaders: requiredHeaders,
                    hint: 'แถวแรกของแผ่นงานต้องมีหัวข้อ: session, en, th และแนะนำให้มี image ด้วย'
                })
            ).setMimeType(ContentService.MimeType.JSON);
        }

        // แปลงเป็น JSON Array
        const jsonData = rows
            .filter(row => row[0] !== '' && row[0] !== null) // กรองแถวว่างออก
            .map(row => {
                const obj = {};
                headers.forEach((header, index) => {
                    if (header === 'session') {
                        obj[header] = parseInt(row[index]) || 1;
                    } else {
                        obj[header] = row[index] || '';
                    }
                });
                // หากไม่มีหัว image ให้สร้างแบบว่างไว้เพื่อให้แอปใช้งานได้ไม่พัง
                if (!obj.hasOwnProperty('image')) {
                    obj['image'] = '';
                }
                return obj;
            });

        return ContentService.createTextOutput(
            JSON.stringify(jsonData)
        ).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(
            JSON.stringify({
                error: 'Server error',
                message: error.toString()
            })
        ).setMimeType(ContentService.MimeType.JSON);
    }
}

/**
 * ฟังก์ชันสำหรับ POST Request (ส่งข้อมูล)
 * รองรับการสร้างแผ่นงานใหม่อัตโนมัติหากชื่อที่ระบุไม่มีอยู่จริงบนชีต
 * 
 * 📥 รูปแบบข้อมูลที่ส่งเข้ามา (Body JSON):
 * 1. แบบดั้งเดิม (Array ตรงๆ):
 *    [ {"session":1, "en":"Apple", "th":"แอปเปิ้ล"}, ... ]
 * 
 * 2. แบบใหม่ (Object ระบุแผ่นงาน):
 *    {
 *       "sheetName": "Fruits",
 *       "data": [ {"session":1, "en":"Apple", "th":"แอปเปิ้ล"}, ... ]
 *    }
 */
function doPost(e) {
    try {
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        
        // 1. รับข้อมูลจาก request body
        let requestData;
        try {
            requestData = JSON.parse(e.postData.contents);
        } catch (parseError) {
            return ContentService.createTextOutput(
                JSON.stringify({
                    status: 'error',
                    message: 'JSON รูปแบบไม่ถูกต้องค่ะ',
                    details: parseError.toString()
                })
            ).setMimeType(ContentService.MimeType.JSON);
        }

        // 2. วิเคราะห์ชื่อชีต และข้อมูลที่จะบันทึก
        let sheetName = e.parameter.sheetName || DEFAULT_SHEET_NAME;
        let vocabList = [];

        if (Array.isArray(requestData)) {
            // แบบเก่า: ส่ง Array มาตรงๆ
            vocabList = requestData;
        } else if (typeof requestData === 'object' && requestData !== null) {
            // แบบใหม่: ส่ง Object { sheetName, data }
            sheetName = requestData.sheetName || sheetName;
            vocabList = requestData.data || [];
        } else {
            return ContentService.createTextOutput(
                JSON.stringify({
                    status: 'error',
                    message: 'รูปแบบข้อมูลที่ส่งมาไม่ถูกต้อง ต้องเป็น Array หรือ Object ค่ะ'
                })
            ).setMimeType(ContentService.MimeType.JSON);
        }

        // 3. ตรวจสอบแผ่นงาน หากไม่มีให้สร้างใหม่อัตโนมัติ! ✨
        let sheet = spreadsheet.getSheetByName(sheetName);
        let isNewSheetCreated = false;

        if (!sheet) {
            sheet = spreadsheet.insertSheet(sheetName);
            sheet.appendRow(['session', 'en', 'th', 'image']); // เขียนหัวข้อ
            isNewSheetCreated = true;
        }

        // ลบข้อมูลเก่าทั้งหมด ยกเว้น header
        const lastRow = sheet.getLastRow();
        if (lastRow > 1) {
            sheet.deleteRows(2, lastRow - 1);
        }

        // เขียนหัวข้อคอลัมน์ซ้ำเพื่อความปลอดภัยและความสวยงาม
        const headers = ['session', 'en', 'th', 'image'];
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

        // 4. เพิ่มข้อมูลคำศัพท์ใหม่ลงในแผ่นงาน
        if (vocabList.length > 0) {
            const newRows = vocabList.map(item => [
                parseInt(item.session) || 1,
                item.en || '',
                item.th || '',
                item.image || ''
            ]);

            sheet.getRange(2, 1, newRows.length, headers.length).setValues(newRows);
        }

        return ContentService.createTextOutput(
            JSON.stringify({
                status: 'success',
                count: vocabList.length,
                sheetName: sheetName,
                isNewSheet: isNewSheetCreated,
                message: isNewSheetCreated ? `สร้างแผ่นงานใหม่ "${sheetName}" และอัปโหลดสำเร็จแล้วค่ะ` : `อัปเดตแผ่นงาน "${sheetName}" สำเร็จแล้วค่ะ`
            })
        ).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(
            JSON.stringify({
                status: 'error',
                message: error.toString()
            })
        ).setMimeType(ContentService.MimeType.JSON);
    }
}

// ========================================
// ฟังก์ชันทดสอบความถูกต้อง
// ========================================

function testGetSheetsList() {
    Logger.log('=== Testing GET Sheets List ===');
    const mockEvent = { parameter: { action: 'getSheets' } };
    const result = doGet(mockEvent);
    Logger.log('Response (Sheets List):');
    Logger.log(result.getContent());
}
