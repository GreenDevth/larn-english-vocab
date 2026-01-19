import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { loadProgress, processSessionEnd, getVocabData, saveVocabData, unlockSessionWithStars } from './utils/storage';
import { preloadVoices } from './utils/tts';
import WelcomeScreen from './components/WelcomeScreen';
import GameScreen from './components/GameScreen';
import ScoreBoard from './components/ScoreBoard';
import OnboardingScreen from './components/OnboardingScreen';
import ParentDashboard from './components/ParentDashboard';
import { useModal } from './contexts/ModalContext';
import ModalContainer from './components/ui/ModalContainer';

function App() {
    const [vocabData, setVocabData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(loadProgress());
    const { showAlert } = useModal();
    // Use a derived state for screen to handle initial load vs onboarding
    const [screen, setScreen] = useState('loading');

    const [selectedSessionId, setSelectedSessionId] = useState(null);
    const [currentScore, setCurrentScore] = useState(0);

    useEffect(() => {
        // 1. Load Voices
        preloadVoices();

        // 2. Load Data (Dynamic Priority)
        const loadData = async () => {
            // Check LocalStorage first
            const localData = getVocabData();
            if (localData && localData.length > 0) {
                console.log("Loaded vocab from LocalStorage");
                setVocabData(localData);
                initScreen(localData);
                return;
            }

            // Fallback to CSV
            console.log("Loading vocab from CSV...");
            try {
                const response = await fetch('./vocab.csv');
                const csvText = await response.text();

                const results = [];
                let currentSession = 1;

                // Manual parsing
                const lines = csvText.split(/\r?\n/);
                lines.forEach(line => {
                    const trimmed = line.trim();
                    if (!trimmed) return;

                    if (trimmed.toLowerCase().startsWith('session')) {
                        const match = trimmed.match(/\d+/);
                        if (match) currentSession = parseInt(match[0]);
                        return;
                    }
                    if (trimmed.toLowerCase().startsWith('en,') || trimmed.toLowerCase().startsWith('en,')) return;

                    const parts = trimmed.split(',');
                    if (parts.length >= 2) {
                        results.push({
                            session: currentSession,
                            en: parts[0].trim(),
                            th: parts[1].trim(),
                            image: parts[2] ? parts[2].trim() : ''
                        });
                    }
                });

                setVocabData(results);
                // Save to LocalStorage for next time (Enabling Dynamic Edits)
                saveVocabData(results);
                initScreen(results);

            } catch (err) {
                console.error("Failed to load CSV", err);
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const initScreen = (data) => {
        const progress = loadProgress();
        setUserData(progress);

        if (!progress.childName) {
            setScreen('onboarding');
        } else {
            setScreen('welcome');
        }
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

    const handleStartSession = (sessionId) => {
        setSelectedSessionId(sessionId);
        setCurrentScore(0);
        setScreen('game');
    };

    const handleUnlockSession = (sessionId) => {
        const success = unlockSessionWithStars(sessionId, 50); // Cost 50 stars
        if (success) {
            setUserData(loadProgress()); // Update UI
            showAlert({
                title: 'เยี่ยมมาก!',
                message: `🎉 ปลดล็อคด่าน ${sessionId} เรียบร้อย!`,
                variant: 'success'
            });
        } else {
            showAlert({
                title: 'ดาวไม่พอ!',
                message: `⭐ ต้องใช้ 50 ดวง (คุณมี ${userData.totalStars})`,
                variant: 'warning'
            });
        }
    };

    const handleGameFinish = (finalScore) => {
        setCurrentScore(finalScore);

        // Pass totalQuestions to calculate passing logic
        const totalQuestions = sessions[selectedSessionId]?.length || 0;
        const newData = processSessionEnd(selectedSessionId, finalScore, totalQuestions);

        setUserData(newData);
        setScreen('score');
    };

    const handleOnboardingComplete = (name) => {
        setUserData(loadProgress()); // Refresh data
        setScreen('welcome');
    };

    if (loading || screen === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-blue-50">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-blue"></div>
            </div>
        );
    }

    return (
        <div className="App font-sans text-gray-900">
            {screen === 'onboarding' && (
                <OnboardingScreen onComplete={handleOnboardingComplete} />
            )}
            {screen === 'welcome' && (
                <WelcomeScreen
                    sessions={sessions}
                    onStartSession={handleStartSession}
                    onUnlockSession={handleUnlockSession}
                    onOpenParent={() => setScreen('parent')}
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
                        const newData = getVocabData();
                        if (newData) setVocabData(newData);
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
