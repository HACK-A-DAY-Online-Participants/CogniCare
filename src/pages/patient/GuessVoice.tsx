import React, { useState, useEffect, useRef } from 'react';
import { X, RotateCcw, Check } from 'lucide-react';

interface GuessVoiceProps {
    onClose: () => void;
    onGameComplete: (score: number) => void;
}

const GuessVoice: React.FC<GuessVoiceProps> = ({ onClose, onGameComplete }) => {
    const [currentVoice, setCurrentVoice] = useState('');
    const [options, setOptions] = useState<string[]>(['Jhenkar', 'PranavRH', 'MPranav']);
    const [correctName, setCorrectName] = useState('');
    const [score, setScore] = useState(0);
    const [round, setRound] = useState(1);
    const [time, setTime] = useState(0);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameCompleted, setGameCompleted] = useState(false);
    const [feedback, setFeedback] = useState<{show: boolean, correct: boolean}>({show: false, correct: false});
    const audioRef = useRef<HTMLAudioElement>(null);

    const voiceFiles: Record<string, string> = {
        Jhenkar: '/voices/Jhenkar.m4a',
        PranavRH: '/voices/PranavRH.m4a',
        MPranav: '/voices/MPranav.m4a'
    };

    const initializeRound = () => {
        const names = Object.keys(voiceFiles);
        const randomName = names[Math.floor(Math.random() * names.length)];
        setCurrentVoice(voiceFiles[randomName]);
        setCorrectName(randomName);
        setOptions(['Jhenkar', 'PranavRH', 'MPranav']);
        setGameStarted(true);
        setGameCompleted(false);
        setFeedback({show: false, correct: false});
    };

    const playVoice = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
        }
    };

    const handleGuessClick = (name: string) => {
        if (gameCompleted) return;

        const isCorrect = name === correctName;
        setFeedback({show: true, correct: isCorrect});

        if (isCorrect) {
            const newScore = score + 10;
            setScore(newScore);
            if (round >= 5) {
                setGameCompleted(true);
                setTimeout(() => {
                    onGameComplete(newScore);
                    onClose();
                }, 1500);
            } else {
                setRound(round + 1);
                setTimeout(() => initializeRound(), 1500);
            }
        } else {
            setGameCompleted(true);
            setTimeout(() => {
                onGameComplete(score);
                onClose();
            }, 2500);
        }
    };

    useEffect(() => {
        initializeRound();
        // Auto-play audio on load might be restricted, so user clicks play
    }, []);



    useEffect(() => {
        let timer: number;
        if (gameStarted && !gameCompleted) {
            timer = window.setInterval(() => {
                setTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [gameStarted, gameCompleted]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content voice-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 style={{ color: '#f59e0b' }}>Guess Voice</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="memory-game-stats">
                    <div className="stat-item">
                        <span className="stat-label">Round:</span>
                        <span className="stat-value">{round}/5</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Time:</span>
                        <span className="stat-value">{formatTime(time)}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Score:</span>
                        <span className="stat-value">{score}</span>
                    </div>
                </div>

                {gameCompleted && (
                    <div className="game-completed-message">
                        🎧 Voice guessing complete! Your score: {score}
                    </div>
                )}

                {feedback.show && (
                    <div className={`feedback-message ${feedback.correct ? 'correct' : 'incorrect'}`}>
                        {feedback.correct ? (
                            <Check size={24} />
                        ) : (
                            <X size={24} />
                        )}
                        {feedback.correct ? 'Correct! Well done!' : 'Not quite right. Try again!'}
                    </div>
                )}

                <div className="voice-instructions">
                    <p>Listen to the voice and identify the speaker:</p>
                </div>

                <div className="voice-controls">
                    <button className="play-voice-btn" onClick={playVoice} disabled={gameCompleted}>
                        🔊 Play Voice
                    </button>
                    <audio ref={audioRef} preload="auto">
                        <source src={currentVoice} type="audio/mp4" />
                        Your browser does not support the audio element.
                    </audio>
                </div>

                <div className="voice-guess-options">
                    {options.map((name, index) => (
                        <button
                            key={index}
                            className="name-option-btn"
                            onClick={() => handleGuessClick(name)}
                            disabled={gameCompleted || feedback.show}
                        >
                            {name}
                        </button>
                    ))}
                </div>

                <div className="memory-game-actions">
                    <button className="btn btn-secondary" onClick={initializeRound}>
                        <RotateCcw size={16} />
                        New Round
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GuessVoice;
