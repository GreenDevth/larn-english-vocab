const STORAGE_KEY = 'larnvocab_kids_v2'; // Bump version for new schema

const defaultState = {
    totalStars: 0,
    completedSessions: [], // IDs of sessions fully completed
    unlockedSessions: [1], // IDs of sessions available to play
    childName: '',       // Registered child name
    parentPin: '',       // PIN for parent portal
    customVocab: null,   // Dynamic vocab list. If null, use CSV default.
};

// --- Core Load/Save ---
export const loadProgress = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        // Merge with defaultState
        return data ? { ...defaultState, ...JSON.parse(data) } : defaultState;
    } catch (error) {
        console.error("Failed to load progress:", error);
        return defaultState;
    }
};

export const saveProgress = (data) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Failed to save progress:", error);
    }
};

// --- Session & Score Logic ---

export const processSessionEnd = (sessionId, score, totalQuestions) => {
    const current = loadProgress();

    // 1. Calculate Stars
    const currentStars = parseInt(current.totalStars || 0, 10);
    const earnedStars = Math.floor(score / 10);
    const newTotalStars = currentStars + earnedStars;

    // 2. Mark Session Complete if score > 0 (Basic completion)
    // You can adjust passing criteria here (e.g., > 50%)
    const passed = score > 0;

    let newCompleted = current.completedSessions || [];
    let newUnlocked = current.unlockedSessions || [1];

    if (passed) {
        if (!newCompleted.includes(sessionId)) {
            newCompleted = [...newCompleted, sessionId];
        }

        // Auto unlock next session
        const nextSessionId = sessionId + 1;
        // Simple logic: if next session exists (we don't know total sessions here effectively, but it's safe to add ID)
        if (!newUnlocked.includes(nextSessionId)) {
            newUnlocked = [...newUnlocked, nextSessionId];
        }
    }

    const newState = {
        ...current,
        totalStars: newTotalStars,
        completedSessions: newCompleted,
        unlockedSessions: newUnlocked
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
            unlockedSessions: [...current.unlockedSessions, sessionId]
        };
        saveProgress(newState);
        return true; // Success
    }
    return false; // Not enough stars
};

// --- Child & Parent Data ---

export const getChildName = () => {
    return loadProgress().childName;
};

export const setChildName = (name) => {
    const current = loadProgress();
    saveProgress({ ...current, childName: name });
};

export const getParentPin = () => {
    return loadProgress().parentPin;
};

export const setParentPin = (pin) => {
    const current = loadProgress();
    saveProgress({ ...current, parentPin: pin });
};

// --- Vocab Data Management ---

export const getVocabData = () => {
    return loadProgress().customVocab; // Returns null if not set (use CSV)
};

export const saveVocabData = (vocabList) => {
    const current = loadProgress();
    saveProgress({ ...current, customVocab: vocabList });
};

export const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
};
