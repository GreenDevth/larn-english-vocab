// === Multi-Profile Storage System v3 ===
//
// Schema ที่ใช้ใน localStorage:
//   larnvocab_profiles         → [{id, name, avatar, createdAt}]  (index ผู้ใช้ทั้งหมด)
//   larnvocab_profile_{id}     → {totalStars, completedSessions, unlockedSessions, childName}
//   larnvocab_active           → profileId (string) ของผู้ที่ login อยู่
//   larnvocab_parent_pin       → PIN ผู้ปกครอง (global, ใช้ร่วมกันทุก profile)
//   larnvocab_vocab            → vocab array (global, ใช้ร่วมกันทุก profile)
//   larnvocab_sheet_url        → Google Sheet URL (global)
//   larnvocab_last_sync        → เวลา sync ล่าสุด (global)
//   larnvocab_selected_sheet   → ชื่อแผ่นงานที่เลือก (global)

const PROFILES_INDEX_KEY = 'larnvocab_profiles';
const ACTIVE_PROFILE_KEY = 'larnvocab_active';
const PARENT_PIN_KEY = 'larnvocab_parent_pin';
const VOCAB_KEY = 'larnvocab_vocab';

const defaultProfileState = {
    totalStars: 0,
    completedSessions: [],
    unlockedSessions: [1],
    childName: '',
    showVocabText: true,
    useStarsForVocab: false,
    vocabStarCost: 10,
};

const getProfileKey = (id) => `larnvocab_profile_${id}`;

// ─── Profile Index Management ────────────────────────────────────────────────

export const getAllProfiles = () => {
    try {
        const data = localStorage.getItem(PROFILES_INDEX_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

const _saveProfilesIndex = (profiles) => {
    localStorage.setItem(PROFILES_INDEX_KEY, JSON.stringify(profiles));
};

/**
 * สร้าง profile ใหม่ คืนค่า profileId
 */
export const createProfile = (name, avatar) => {
    const selectedAvatar = avatar || '🐱';
    const id = `p_${Date.now()}`;
    const profiles = getAllProfiles();
    profiles.push({ id, name, avatar: selectedAvatar, createdAt: Date.now() });
    _saveProfilesIndex(profiles);
    const initData = { ...defaultProfileState, childName: name };
    localStorage.setItem(getProfileKey(id), JSON.stringify(initData));
    return id;
};

/**
 * ลบ profile และข้อมูลทั้งหมดของ profile นั้น
 */
export const deleteProfile = (profileId) => {
    const remaining = getAllProfiles().filter(p => p.id !== profileId);
    _saveProfilesIndex(remaining);
    localStorage.removeItem(getProfileKey(profileId));
    if (getActiveProfileId() === profileId) {
        localStorage.removeItem(ACTIVE_PROFILE_KEY);
    }
};

/**
 * โหลด progress ของ profile ใดก็ได้ (สำหรับแสดงบน Profile Selector)
 */
export const getProfileProgress = (profileId) => {
    try {
        const data = localStorage.getItem(getProfileKey(profileId));
        return data ? { ...defaultProfileState, ...JSON.parse(data) } : { ...defaultProfileState };
    } catch {
        return { ...defaultProfileState };
    }
};

// ─── Active Profile Session ───────────────────────────────────────────────────

export const getActiveProfileId = () => {
    return localStorage.getItem(ACTIVE_PROFILE_KEY) || null;
};

export const setActiveProfileId = (id) => {
    if (id) {
        localStorage.setItem(ACTIVE_PROFILE_KEY, id);
    } else {
        localStorage.removeItem(ACTIVE_PROFILE_KEY);
    }
};

// ─── Core Load/Save (ทำงานกับ active profile เสมอ) ─────────────────────────

export const loadProgress = () => {
    const id = getActiveProfileId();
    if (!id) return { ...defaultProfileState };
    try {
        const data = localStorage.getItem(getProfileKey(id));
        return data ? { ...defaultProfileState, ...JSON.parse(data) } : { ...defaultProfileState };
    } catch {
        return { ...defaultProfileState };
    }
};

export const saveProgress = (data) => {
    const id = getActiveProfileId();
    if (!id) return;
    try {
        localStorage.setItem(getProfileKey(id), JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save progress:', e);
    }
};

// ─── Session & Score Logic ────────────────────────────────────────────────────

export const processSessionEnd = (sessionId, score, totalQuestions) => {
    const current = loadProgress();
    const currentStars = parseInt(current.totalStars || 0, 10);
    const earnedStars = Math.floor(score / 10);
    const newTotalStars = currentStars + earnedStars;
    const passed = score > 0;

    let newCompleted = current.completedSessions || [];
    let newUnlocked = current.unlockedSessions || [1];

    if (passed && !newCompleted.includes(sessionId)) {
        newCompleted = [...newCompleted, sessionId];
        // NOTE: ไม่ auto-unlock ด่านถัดไป ผู้เล่นต้องใช้ดาวปลดล็อคเอง
    }

    const newState = {
        ...current,
        totalStars: newTotalStars,
        completedSessions: newCompleted,
        unlockedSessions: newUnlocked,
    };

    saveProgress(newState);
    return newState;
};

export const unlockSessionWithStars = (sessionId, cost) => {
    const current = loadProgress();
    const currentStars = parseInt(current.totalStars || 0, 10);
    if (currentStars >= cost && !current.unlockedSessions.includes(sessionId)) {
        const newState = {
            ...current,
            totalStars: currentStars - cost,
            unlockedSessions: [...current.unlockedSessions, sessionId],
        };
        saveProgress(newState);
        return true;
    }
    return false;
};

// ─── Child Name ───────────────────────────────────────────────────────────────

export const getChildName = () => loadProgress().childName;

export const setChildName = (name) => {
    const current = loadProgress();
    saveProgress({ ...current, childName: name });
    // Sync ชื่อไปยัง profiles index ด้วย เพื่อให้ Profile Selector แสดงชื่อถูกต้อง
    const id = getActiveProfileId();
    if (id) {
        const profiles = getAllProfiles().map(p => (p.id === id ? { ...p, name } : p));
        _saveProfilesIndex(profiles);
    }
};

// ─── Parent PIN (global, ใช้ร่วมกันทุก profile) ─────────────────────────────

export const getParentPin = () => {
    return localStorage.getItem(PARENT_PIN_KEY) || '1234';
};

export const setParentPin = (pin) => {
    localStorage.setItem(PARENT_PIN_KEY, pin);
};

// ─── Vocab Data (global, ใช้ร่วมกันทุก profile) ─────────────────────────────

export const getVocabData = () => {
    try {
        const data = localStorage.getItem(VOCAB_KEY);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
};

export const saveVocabData = (vocabList) => {
    try {
        localStorage.setItem(VOCAB_KEY, JSON.stringify(vocabList));
    } catch (e) {
        console.error('Failed to save vocab:', e);
    }
};

// ─── Reset ───────────────────────────────────────────────────────────────────

/**
 * รีเซ็ตเฉพาะ profile ที่ login อยู่ (ดาว, ด่านที่ผ่าน ฯลฯ)
 * โปรไฟล์ยังคงอยู่ แค่ข้อมูล progress ถูกล้าง
 */
export const resetActiveProfileData = () => {
    const id = getActiveProfileId();
    if (!id) return;
    const profiles = getAllProfiles();
    const profile = profiles.find(p => p.id === id);
    const name = profile ? profile.name : '';
    localStorage.setItem(getProfileKey(id), JSON.stringify({ ...defaultProfileState, childName: name }));
};

/**
 * ล้างข้อมูลทั้งหมดใน localStorage และ reload (nuclear option)
 */
export const resetAllData = () => {
    localStorage.clear();
    window.location.reload();
};

// ─── Export / Import (Backup & Restore) ──────────────────────────────────────

/**
 * รวบรวมข้อมูลทั้งหมดออกมาเป็น plain object เพื่อ export เป็น JSON
 * รูปแบบ:
 * {
 *   version, exportedAt,
 *   profiles (index), profileData (แต่ละ profile),
 *   vocab, parentPin, sheetUrl, selectedSheet, lastSync
 * }
 */
export const exportAllData = () => {
    const profiles = getAllProfiles();
    const profileData = {};
    profiles.forEach(p => {
        const raw = localStorage.getItem(getProfileKey(p.id));
        if (raw) {
            try {
                profileData[p.id] = JSON.parse(raw);
            } catch {
                profileData[p.id] = {};
            }
        }
    });

    return {
        version: '3',
        appName: 'LarnVocab Kids',
        exportedAt: new Date().toISOString(),
        profiles,
        profileData,
        vocab: getVocabData(),
        parentPin: getParentPin(),
        sheetUrl: localStorage.getItem('larnvocab_sheet_url') || '',
        selectedSheet: localStorage.getItem('larnvocab_selected_sheet') || 'VocabData',
        lastSync: localStorage.getItem('larnvocab_last_sync') || '',
    };
};

/**
 * นำเข้าข้อมูลจาก JSON backup object กลับสู่ localStorage
 * @param {object} jsonData - ข้อมูลจาก exportAllData()
 * @throws {Error} หากไฟล์ไม่ถูกต้อง
 */
export const importAllData = (jsonData) => {
    if (!jsonData || !jsonData.version || !Array.isArray(jsonData.profiles)) {
        throw new Error('รูปแบบไฟล์ไม่ถูกต้อง (ต้องเป็น LarnVocab backup file)');
    }

    // Restore profiles index
    localStorage.setItem(PROFILES_INDEX_KEY, JSON.stringify(jsonData.profiles));

    // Restore แต่ละ profile's progress
    if (jsonData.profileData && typeof jsonData.profileData === 'object') {
        Object.entries(jsonData.profileData).forEach(([id, data]) => {
            localStorage.setItem(getProfileKey(id), JSON.stringify(data));
        });
    }

    // Restore vocab (ถ้ามี)
    if (jsonData.vocab && Array.isArray(jsonData.vocab)) {
        localStorage.setItem(VOCAB_KEY, JSON.stringify(jsonData.vocab));
    }

    // Restore parent PIN
    if (jsonData.parentPin) {
        localStorage.setItem(PARENT_PIN_KEY, String(jsonData.parentPin));
    }

    // Restore sheet settings
    if (jsonData.sheetUrl) localStorage.setItem('larnvocab_sheet_url', jsonData.sheetUrl);
    if (jsonData.selectedSheet) localStorage.setItem('larnvocab_selected_sheet', jsonData.selectedSheet);
    if (jsonData.lastSync) localStorage.setItem('larnvocab_last_sync', jsonData.lastSync);

    // Clear active profile เพื่อให้กลับไปหน้า profile selector
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
};

/**
 * บันทึก progress ของ profile ใดก็ได้ โดยระบุ profileId
 */
export const saveProfileProgress = (profileId, data) => {
    if (!profileId) return;
    try {
        localStorage.setItem(getProfileKey(profileId), JSON.stringify(data));
        // Sync ชื่อไปยัง profiles index ด้วย หากมีการเปลี่ยนแปลงชื่อ
        if (data.childName) {
            const profiles = getAllProfiles().map(p => (p.id === profileId ? { ...p, name: data.childName } : p));
            _saveProfilesIndex(profiles);
        }
    } catch (e) {
        console.error('Failed to save profile progress:', e);
    }
};


