const PREF_KEY = 'larnvocab_voice_pref';

export const getVoices = () => {
    return new Promise((resolve) => {
        let voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            resolve(voices);
            return;
        }

        // Voices might load asynchronously
        window.speechSynthesis.onvoiceschanged = () => {
            voices = window.speechSynthesis.getVoices();
            resolve(voices);
        };

        // Fallback timeout
        setTimeout(() => {
            resolve(window.speechSynthesis.getVoices());
        }, 1000);
    });
};

export const getVoicePreference = (langPrefix) => {
    try {
        const prefs = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
        return prefs[langPrefix];
    } catch (e) {
        return null;
    }
};

export const setVoicePreference = (langPrefix, voiceURI) => {
    try {
        const prefs = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
        prefs[langPrefix] = voiceURI;
        localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
    } catch (e) {
        console.error("Failed to save voice pref", e);
    }
};

export const speak = async (text, lang = 'en-US', shouldCancel = true, rate = 0.9) => {
    if (!('speechSynthesis' in window)) return;

    if (shouldCancel) {
        window.speechSynthesis.cancel();
    }

    return new Promise(async (resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = rate;
        utterance.pitch = 1.1;

        const voices = await getVoices();
        const langPrefix = lang.split('-')[0]; // 'en' or 'th'
        const preferredURI = getVoicePreference(langPrefix);

        let selectedVoice = null;

        if (preferredURI) {
            selectedVoice = voices.find(v => v.voiceURI === preferredURI);
        }

        if (!selectedVoice) {
            // Fallback logic
            if (lang.startsWith('en')) {
                selectedVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Female") || v.lang === 'en-US');
            } else if (lang.startsWith('th')) {
                selectedVoice = voices.find(v => v.lang === 'th-TH');
            }
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        utterance.onend = () => {
            resolve();
        };

        utterance.onerror = (e) => {
            console.error("TTS Error:", e);
            resolve();
        };

        window.speechSynthesis.speak(utterance);
    });
};

export const preloadVoices = () => {
    getVoices(); // Just trigger loading
};
