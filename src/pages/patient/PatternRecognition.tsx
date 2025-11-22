import React, { useState, useEffect } from 'react';
import { X, RotateCcw, Check } from 'lucide-react';

interface PatternRecognitionProps {
    onClose: () => void;
    onGameComplete: (score: number) => void;
}

// Pattern Recognition Game: Match the exact pattern from given options
const PatternRecognition: React.FC<PatternRecognitionProps> = ({ onClose, onGameComplete }) => {
    const [targetPattern, setTargetPattern] = useState<number[]>([]);
    const [options, setOptions] = useState<number[][]>([]);
    const [correctOption, setCorrectOption] = useState(0);
    const [level, setLevel] = useState(1);
    const [round, setRound] = useState(1);
    const [score, setScore] = useState(0);
    const maxRounds = 5;
    const [time, setTime] = useState(0);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameCompleted, setGameCompleted] = useState(false);
    const [feedback, setFeedback] = useState<{show: boolean, correct: boolean}>({show: false, correct: false});

    const gridSize = 2; // 2x2 grid, 4 tiles
    const colors = ['#FFC107', '#2196F3', '#4CAF50', '#FF5722']; // Yellow, Blue, Green, Red

    const generatePattern = () => {
        let pattern = [];
        for (let i = 0; i < gridSize * gridSize; i++) {
            pattern.push(i % colors.length); // Simple repeating pattern
        }
        // Add some randomness based on level
        for (let i = 0; i < level; i++) {
            let randomIndex = Math.floor(Math.random() * pattern.length);
            pattern[randomIndex] = Math.floor(Math.random() * colors.length);
        }
        return pattern;
    };

    const generateOptions = (target: number[]) => {
        let patterns = [target]; // Correct one
        // Generate 3 incorrect variations
        for (let i = 1; i < 4; i++) {
            let variation = [...target];
            // Change 1-2 tiles randomly
            for (let j = 0; j < Math.min(2, level); j++) {
                let index = Math.floor(Math.random() * variation.length);
                let currentColor = variation[index];
                let newColor;
                do {
                    newColor = Math.floor(Math.random() * colors.length);
                } while (newColor === currentColor);
                variation[index] = newColor;
            }
            patterns.push(variation);
        }
        // Shuffle options
        for (let i = patterns.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [patterns[i], patterns[j]] = [patterns[j], patterns[i]];
        }
        return patterns;
    };

    const initializeGame = () => {
        const target = generatePattern();
        setTargetPattern(target);
        const opts = generateOptions(target);
        setOptions(opts);
        setCorrectOption(opts.findIndex(p => JSON.stringify(p) === JSON.stringify(target)));
        setGameStarted(true);
        setGameCompleted(false);
        setFeedback({show: false, correct: false});
    };

    const handleOptionClick = (optionIndex: number) => {
        if (gameCompleted) return;

        const isCorrect = optionIndex === correctOption;
        setFeedback({show: true, correct: isCorrect});

        if (isCorrect) {
            setFeedback({show: true, correct: isCorrect});
            const newScore = score + level * 10;
            setScore(newScore);
            if (level >= 5) {
                setGameCompleted(true);
                setTimeout(() => {
                    onGameComplete(newScore);
                    onClose();
                }, 1500);
            } else {
                setLevel(level + 1);
                setTimeout(() => initializeGame(), 1500);
            }
        } else {
            // Wrong, end game
            const finalScore = calculateScore(level, time, score);
            setScore(finalScore);
            setGameCompleted(true);
            setTimeout(() => {
                onGameComplete(finalScore);
                onClose();
            }, 2500);
        }
    };

    useEffect(() => {
        initializeGame();
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

    const calculateScore = (level: number, time: number, score: number): number => {
        const timePenalty = Math.floor(time / 10);
        return Math.max(50, score - timePenalty);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const renderGrid = (pattern: number[]) => (
        <div
            className="pattern-grid"
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '2px',
                width: '68px',
                height: '68px',
            }}
        >
            {pattern.map((colorIndex, index) => (
                <div
                    key={index}
                    className="pattern-tile"
                    style={{
                        backgroundColor: colors[colorIndex],
                        borderRadius: '4px',
                    }}
                />
            ))}
        </div>
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content pattern-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 style={{ color: '#10b981' }}>Pattern Recognition</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="memory-game-stats">
                    <div className="stat-item">
                        <span className="stat-label">Level:</span>
                        <span className="stat-value">{level}</span>
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
                        🎨 Pattern recognition complete! Your score: {score}
                    </div>
                )}

                {feedback.show && (
                    <div className={`feedback-message ${feedback.correct ? 'correct' : 'incorrect'}`}>
                        {feedback.correct ? (
                            <>
                                <Check size={24} />
                                <span>Correct! Well done!</span>
                            </>
                        ) : (
                            <>
                                <X size={24} />
                                <span>Not quite right. Try again!</span>
                            </>
                        )}
                    </div>
                )}

                <div className="pattern-instructions">
                    <p>Match the pattern below:</p>
                </div>

                <div className="target-pattern-container">
                    {renderGrid(targetPattern)}
                </div>

                <div className="pattern-instructions">
                    <p>Click on the matching pattern:</p>
                </div>

                <div className="pattern-options">
                    {options.map((pattern, index) => (
                        <button
                            key={index}
                            className="pattern-option"
                            onClick={() => handleOptionClick(index)}
                            disabled={gameCompleted || feedback.show}
                        >
                            {renderGrid(pattern)}
                        </button>
                    ))}
                </div>

                <div className="memory-game-actions">
                    <button className="btn btn-secondary" onClick={initializeGame}>
                        <RotateCcw size={16} />
                        New Game
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PatternRecognition;
