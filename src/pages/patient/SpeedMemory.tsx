import React, { useState, useEffect } from 'react';
import { X, RotateCcw, Timer, Zap, Target } from 'lucide-react';

interface SpeedMemoryProps {
    onClose: () => void;
    onGameComplete: (score: number) => void;
}

const SpeedMemory: React.FC<SpeedMemoryProps> = ({ onClose, onGameComplete }) => {
    const [targetNumber, setTargetNumber] = useState<number>(0);
    const [options, setOptions] = useState<number[]>([]);
    const [round, setRound] = useState(0);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30); // 30 seconds for speed challenge
    const [gameStarted, setGameStarted] = useState(false);
    const [gameCompleted, setGameCompleted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [feedback, setFeedback] = useState<{message: string, type: 'correct' | 'incorrect'} | null>(null);

    const generateRound = (currentRound: number) => {
        // Increase difficulty as rounds progress
        const maxNumber = 10 + Math.floor(currentRound / 3) * 5; // Start at 10, increase every 3 rounds

        const target = Math.floor(Math.random() * maxNumber) + 1;
        setTargetNumber(target);

        // Generate 3 incorrect options and 1 correct one
        const incorrect: number[] = [];
        while (incorrect.length < 3) {
            const num = Math.floor(Math.random() * maxNumber) + 1;
            if (num !== target && !incorrect.includes(num)) {
                incorrect.push(num);
            }
        }

        // Place correct answer randomly among the 4 options
        const allOptions = [...incorrect];
        allOptions.splice(Math.floor(Math.random() * 4), 0, target);

        setOptions(allOptions);
        setFeedback(null);
    };

    const initializeGame = () => {
        setRound(0);
        setCorrectAnswers(0);
        setTimeLeft(30);
        setGameStarted(false);
        setGameCompleted(false);
        setGameOver(false);
        setFeedback(null);
    };

    useEffect(() => {
        generateRound(0);
    }, []);

    useEffect(() => {
        let timer: number;
        if (gameStarted && !gameCompleted && !gameOver && timeLeft > 0) {
            timer = window.setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        setGameOver(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [gameStarted, gameCompleted, gameOver, timeLeft]);

    useEffect(() => {
        if (gameOver) {
            const score = calculateScore(correctAnswers, round, timeLeft);
            setTimeout(() => {
                onGameComplete(score);
                onClose();
            }, 2000);
        }
    }, [gameOver, correctAnswers, round, timeLeft, onClose, onGameComplete]);

    const calculateScore = (correct: number, totalRounds: number, timeLeft: number): number => {
        // Base score depends on accuracy and speed
        const baseScore = correct * 10; // 10 points per correct answer
        const speedBonus = timeLeft * 2; // 2 points per second left
        const difficultyBonus = Math.floor(totalRounds / 3) * 5; // Bonus for reaching higher rounds
        return Math.max(0, baseScore + speedBonus + difficultyBonus);
    };

    const handleOptionClick = (selected: number) => {
        if (!gameStarted) {
            setGameStarted(true);
        }
        if (gameOver || gameCompleted) return;

        if (selected === targetNumber) {
            setCorrectAnswers(prev => prev + 1);
            setFeedback({ message: 'Correct!', type: 'correct' });

            // Next round after a brief delay
            setTimeout(() => {
                const nextRound = round + 1;
                setRound(nextRound);
                generateRound(nextRound);
            }, 1000);
        } else {
            setFeedback({ message: 'Incorrect!', type: 'incorrect' });
            setTimeout(() => {
                setFeedback(null);
            }, 1200);
        }
    };

    const getTimerColor = () => {
        if (timeLeft > 15) return '#10b981'; // green
        if (timeLeft > 5) return '#f59e0b'; // yellow
        return '#ef4444'; // red
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 style={{ color: '#ec4899' }}>
                        <Zap size={20} style={{ marginRight: '8px' }} />
                        Speed Find
                    </h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="memory-game-stats">
                    <div className="stat-item">
                        <span className="stat-label">Score:</span>
                        <span className="stat-value">{correctAnswers}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Time:</span>
                        <span className="stat-value" style={{ color: getTimerColor() }}>
                            <Timer size={16} style={{ marginRight: '4px' }} />
                            {timeLeft}s
                        </span>
                    </div>
                </div>

                {gameCompleted && (
                    <div className="game-completed-message">
                        🎉 Congratulations! Game Complete!
                    </div>
                )}

                {gameOver && !gameCompleted && (
                    <div className="game-completed-message" style={{ color: '#ef4444' }}>
                        ⏰ Time's up! Final Score: {correctAnswers}
                    </div>
                )}

                {!gameOver && !gameCompleted && (
                    <>
                        <div className="speed-find-target">
                            <Target size={32} style={{ marginBottom: '16px', color: '#ec4899' }} />
                            <div className="target-number">
                                {targetNumber}
                            </div>
                            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>
                                Find this number below!
                            </p>
                        </div>

                        {feedback && (
                            <div className={`feedback-message ${feedback.type}`} style={{ marginBottom: '24px' }}>
                                {feedback.message}
                            </div>
                        )}

                        <div className="speed-find-options">
                            {options.map((option, index) => (
                                <button
                                    key={index}
                                    className="speed-find-option"
                                    onClick={() => handleOptionClick(option)}
                                    disabled={gameOver || gameCompleted || !!feedback}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </>
                )}

                <div className="memory-game-actions">
                    <button className="btn btn-secondary" onClick={initializeGame}>
                        <RotateCcw size={16} />
                        Restart
                    </button>
                    {gameOver && (
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                const score = calculateScore(correctAnswers, round, timeLeft);
                                onGameComplete(score);
                            }}
                        >
                            View Score
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SpeedMemory;
