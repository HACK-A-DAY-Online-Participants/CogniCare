import React, { useState, useEffect, useRef } from 'react';
import { X, Target, Check } from 'lucide-react';

interface AttentionTrainingProps {
    onClose: () => void;
    onGameComplete: (score: number) => void;
}

const AttentionTraining: React.FC<AttentionTrainingProps> = ({ onClose, onGameComplete }) => {
    const [round, setRound] = useState(1);
    const [time, setTime] = useState(0);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameCompleted, setGameCompleted] = useState(false);
    const [feedback, setFeedback] = useState<{show: boolean, correct: boolean, timeTaken?: number}>({show: false, correct: false});
    const [currentSymbols, setCurrentSymbols] = useState<string[]>([]);
    const [targetIndex, setTargetIndex] = useState(-1);
    const [startTime, setStartTime] = useState(0);
    const timerRef = useRef<number | null>(null);
    const gameTimerRef = useRef<number | null>(null);

    const shapes = {
        circle: ['🔴', '🔵', '🟡', '🟢'],
        square: ['⬜', '⬛', '🟨', '🟦'],
        triangle: ['▲', '△', '◼', '◆']
    };

    const generateRound = () => {
        const shapeTypes = Object.keys(shapes);
        const targetShape = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
        const baseShape = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
        const baseSymbols = shapes[baseShape as keyof typeof shapes];
        const baseSymbol = baseSymbols[Math.floor(Math.random() * baseSymbols.length)];
        const targetSymbols = shapes[targetShape as keyof typeof shapes].filter(s => s !== baseSymbol);
        const targetSymbol = targetSymbols[Math.floor(Math.random() * targetSymbols.length)];

        const symbols = Array(9).fill(baseSymbol);
        const randomIndex = Math.floor(Math.random() * 9);
        symbols[randomIndex] = targetSymbol;
        setCurrentSymbols(symbols);
        setTargetIndex(randomIndex);
        setGameStarted(true);
        setStartTime(Date.now());
    };

    const startGame = () => {
        setRound(1);
        setTime(0);
        setGameCompleted(false);
        setFeedback({show: false, correct: false});
        generateRound();
    };

    const handleSymbolClick = (index: number) => {
        if (!gameStarted || gameCompleted || feedback.show) return;

        const elapsed = Date.now() - startTime;
        const isCorrect = index === targetIndex;

        setFeedback({show: true, correct: isCorrect, timeTaken: elapsed});

        if (round >= 5) {
            setGameCompleted(true);
            const totalScore = isCorrect ? Math.max(0, 100 - Math.floor(elapsed / 10)) : 0;
            setTimeout(() => {
                onGameComplete(totalScore);
                onClose();
            }, 2000);
        } else {
            setTimeout(() => {
                setRound(r => r + 1);
                generateRound();
                setFeedback({show: false, correct: false});
            }, 1500);
        }
    };

    useEffect(() => {
        timerRef.current = window.setInterval(() => {
            if (gameStarted && !gameCompleted) {
                setTime(Math.floor((Date.now() - startTime) / 1000));
            }
        }, 100);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [gameStarted, gameCompleted, startTime]);

    useEffect(() => {
        return () => {
            if (gameTimerRef.current) clearTimeout(gameTimerRef.current);
        };
    }, []);

    const getInstruction = () => {
        return "Find the symbol that is different from the others!";
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content attention-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 style={{ color: '#f59e0b' }}>Attention Training</h2>
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
                        <span className="stat-value">{time}s</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Avg Time:</span>
                        <span className="stat-value">{round > 1 ? (time / (round - 1)).toFixed(1) : 0}s</span>
                    </div>
                </div>

                {gameCompleted && (
                    <div className="game-completed-message">
                        🎯 Attention training complete! Good focus!
                    </div>
                )}

                {!gameStarted ? (
                    <div className="attention-start">
                        <p>Welcome to Attention Training!</p>
                        <p>Test your ability to find the odd symbol out.</p>
                        <button className="btn btn-primary" onClick={startGame}>
                            Start Training
                        </button>
                    </div>
                ) : (
                    <>
                        {feedback.show ? (
                            <div className={`feedback-message ${feedback.correct ? 'correct' : 'incorrect'}`}>
                                {feedback.correct ? (
                                    <>
                                        <Check size={24} />
                                        <span>Correct! Time: {(feedback.timeTaken! / 1000).toFixed(2)}s</span>
                                    </>
                                ) : (
                                    <>
                                        <X size={24} />
                                        <span>Wrong target! Try harder next time.</span>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="attention-instruction">
                                <p>{getInstruction()}</p>
                            </div>
                        )}

                        <div className="attention-grid">
                            {currentSymbols.map((symbol, index) => (
                                <button
                                    key={index}
                                    className="symbol-tile"
                                    style={{ fontSize: '3em', padding: '1em', width: '120px', height: '120px' }}
                                    onClick={() => handleSymbolClick(index)}
                                    disabled={gameCompleted || feedback.show}
                                >
                                    {symbol}
                                </button>
                            ))}
                        </div>
                    </>
                )}

                <div className="memory-game-actions">
                    <button className="btn btn-secondary" onClick={startGame}>
                        <Target size={16} />
                        Restart
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AttentionTraining;
