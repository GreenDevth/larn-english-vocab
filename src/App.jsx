import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import {
    loadProgress,
    processSessionEnd,
    getVocabData,
    saveVocabData,
    unlockSessionWithStars,
    getAllProfiles,
    setActiveProfileId,
} from './utils/storage';
import { preloadVoices } from './utils/tts';
import ProfileSelectorScreen from './components/ProfileSelectorScreen';
import WelcomeScreen from './components/WelcomeScreen';
import GameScreen from './components/GameScreen';
import ScoreBoard from './components/ScoreBoard';
import ParentDashboard from './components/ParentDashboard';
import { useModal } from './contexts/ModalContext';
import ModalContainer from './components/ui/ModalContainer';

function App() {
    const [vocabData, setVocabData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(loadProgress());
    const { showAlert } = useModal();
    const [screen, setScreen] = useState('loading');

    const [selectedSessionId, setSelectedSessionId] = useState(null);
    const [currentScore, setCurrentScore] = useState(0);

    useEffect(() => {
        // 1. Load Voices
        preloadVoices();

        // 2. Load Vocab Data
        const loadData = async () => {
            // ตรวจ LocalStorage ก่อน (global vocab key)
            const localData = getVocabData();
            if (localData && localData.length > 0) {
                console.log('Loaded vocab from LocalStorage');
                setVocabData(localData);
                initScreen();
                return;
            }

            // Fallback: โหลดจาก CSV
            console.log('Loading vocab from CSV...');
            try {
                const response = await fetch('./vocab.csv');
                const csvText = await response.text();

                const results = [];
                let currentSession = 1;

                const lines = csvText.split(/\r?\n/);
                lines.forEach(line => {
                    const trimmed = line.trim();
                    if (!trimmed) return;

                    if (trimmed.toLowerCase().startsWith('session')) {
                        const match = trimmed.match(/\d+/);
                        if (match) currentSession = parseInt(match[0]);
                        return;
                    }
                    if (trimmed.toLowerCase().startsWith('en,')) return;

                    const parts = trimmed.split(',');
                    if (parts.length >= 2) {
                        results.push({
                            session: currentSession,
                            en: parts[0].trim(),
                            th: parts[1].trim(),
                            image: parts[2] ? parts[2].trim() : '',
                        });
                    }
                });

                setVocabData(results);
                saveVocabData(results);
                initScreen();
            } catch (err) {
                console.error('Failed to load CSV', err);
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const initScreen = () => {
        // ทุกครั้งที่โหลด → ไปหน้า Profile Selector เสมอ
        setScreen('profile-select');
        setLoading(false);
    };

    const sessions = useMemo(() => {
        const groups = {};
        vocabData.forEach(item => {
            if (!groups[item.session]) groups[item.session] = [];
            groups[item.session].push(item);
        });
        return groups;
    }, [vocabData]);

    // ── Profile Handlers ───────────────────────────────────────────────────────

    const handleSelectProfile = (profileId) => {
        setActiveProfileId(profileId);
        setUserData(loadProgress());
        setScreen('welcome');
    };

    const handleSwitchUser = () => {
        setScreen('profile-select');
    };

    // ── Session Handlers ───────────────────────────────────────────────────────

    const handleStartSession = (sessionId) => {
        setSelectedSessionId(sessionId);
        setCurrentScore(0);
        setScreen('game');
    };

    const handleUnlockSession = (sessionId) => {
        const success = unlockSessionWithStars(sessionId, 50);
        if (success) {
            setUserData(loadProgress());
            showAlert({
                title: 'เยี่ยมมาก!',
                message: `🎉 ปลดล็อคด่าน ${sessionId} เรียบร้อย!`,
                variant: 'success',
            });
        } else {
            const freshData = loadProgress();
            const alreadyUnlocked = freshData.unlockedSessions.includes(sessionId);
            showAlert({
                title: alreadyUnlocked ? 'ปลดล็อคแล้ว!' : 'ดาวไม่พอ!',
                message: alreadyUnlocked
                    ? `✅ ด่าน ${sessionId} ปลดล็อคไปแล้ว`
                    : `⭐ ต้องใช้ 50 ดวง (คุณมี ${freshData.totalStars} ดวง)`,
                variant: alreadyUnlocked ? 'info' : 'warning',
            });
        }
    };

    const handleGameFinish = (finalScore) => {
        setCurrentScore(finalScore);
        const totalQuestions = sessions[selectedSessionId]?.length || 0;
        const newData = processSessionEnd(selectedSessionId, finalScore, totalQuestions);
        setUserData(newData);
        setScreen('score');
    };

    // ── Loading State ──────────────────────────────────────────────────────────

    if (loading || screen === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-blue-50">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-blue"></div>
            </div>
        );
    }

    return (
        <div className="App font-sans text-gray-900">
            {screen === 'profile-select' && (
                <ProfileSelectorScreen
                    onSelectProfile={handleSelectProfile}
                    onOpenParent={() => setScreen('parent')}
                />
            )}
            {screen === 'welcome' && (
                <WelcomeScreen
                    sessions={sessions}
                    onStartSession={handleStartSession}
                    onUnlockSession={handleUnlockSession}
                    onOpenParent={() => setScreen('parent')}
                    onSwitchUser={handleSwitchUser}
                    userData={userData}
                />
            )}
            {screen === 'game' && (
                <GameScreen
                    sessionData={sessions[selectedSessionId]}
                    onFinish={handleGameFinish}
                    onExit={() => setScreen('welcome')}
                />
            )}
            {screen === 'score' && (
                <ScoreBoard
                    score={currentScore}
                    totalQuestions={sessions[selectedSessionId]?.length || 0}
                    onRetry={() => handleStartSession(selectedSessionId)}
                    onHome={() => setScreen('welcome')}
                    childName={userData.childName}
                />
            )}
            {screen === 'parent' && (
                <ParentDashboard
                    onExit={() => {
                        const newVocab = getVocabData();
                        if (newVocab) setVocabData(newVocab);
                        setUserData(loadProgress());
                        setScreen('welcome');
                    }}
                />
            )}
            <ModalContainer />
        </div>
    );
}

export default App;
