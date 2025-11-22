import React, { useState, useEffect } from 'react';
import { X, RotateCcw, Check } from 'lucide-react';

interface LogicPuzzleProps {
    onClose: () => void;
    onGameComplete: (score: number) => void;
}

// Memory Sequence Game: Repeat the sequence by clicking the colored tiles in the same order
const LogicPuzzle: React.FC<LogicPuzzleProps> = ({ onClose, onGameComplete }) => {
    const [sequence, setSequence] = useState<number[]>([]);
    const [playerSequence, setPlayerSequence] = useState<number[]>([]);
    const [level, setLevel] = useState(1);
    const [isShowingSequence, setIsShowingSequence] = useState(false);
    const [currentShowingIndex, setCurrentShowingIndex] = useState(0);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameCompleted, setGameCompleted] = useState(false);
    const [score, setScore] = useState(0);
    const [time, setTime] = useState(0);
    const [flashing, setFlashing] = useState<number | null>(null);
    const [selectedTile, setSelectedTile] = useState<number | null>(null);

    const colors = ['#FFC107', '#2196F3', '#4CAF50', '#FF5722', '#9C27B0', '#FF9800'];

    const initializeGame = () => {
        setSequence([]);
        setPlayerSequence([]);
        setLevel(1);
        setCurrentShowingIndex(0);
        setGameStarted(false);
        setGameCompleted(false);
        setScore(0);
        setTime(0);
        setFlashing(null);
        generateSequence(1);
    };

    const generateSequence = (level: number) => {
        const newSequence = [];
        for (let i = 0; i < level + 2; i++) {
            newSequence.push(Math.floor(Math.random() * 4));
        }
        setSequence(newSequence);
        setSelectedTile(null);
        setTimeout(() => {
            setIsShowingSequence(true);
            setCurrentShowingIndex(0);
        }, 500);
    };

    useEffect(() => {
        if (isShowingSequence && currentShowingIndex < sequence.length) {
            setFlashing(sequence[currentShowingIndex]);
            setTimeout(() => {
                setFlashing(null);
                setTimeout(() => {
                    setCurrentShowingIndex(currentShowingIndex + 1);
                }, 300);
            }, 700);
        } else if (isShowingSequence && currentShowingIndex >= sequence.length) {
            setIsShowingSequence(false);
            setGameStarted(true);
        }
    }, [currentShowingIndex, isShowingSequence, sequence]);

    const handleTileClick = (tileIndex: number) => {
        if (!gameStarted || isShowingSequence) return;

        setSelectedTile(tileIndex);
        setTimeout(() => setSelectedTile(null), 300);

        const newPlayerSequence = [...playerSequence, tileIndex];
        setPlayerSequence(newPlayerSequence);

        if (newPlayerSequence[newPlayerSequence.length - 1] !== sequence[newPlayerSequence.length - 1]) {
            // Wrong move, repeat the level
            setPlayerSequence([]);
            setCurrentShowingIndex(0);
            setTimeout(() => {
                setIsShowingSequence(true);
            }, 1500);
        } else if (newPlayerSequence.length === sequence.length) {
            // Level completed
            const newScore = score + level * 10;
            setScore(newScore);
            setLevel(level + 1);
            setPlayerSequence([]);
            setTimeout(() => generateSequence(level + 1), 1000);
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

    const calculateScore = (level: number, time: number): number => {
        const baseScore = 200;
        const levelBonus = level * 20;
        const timePenalty = Math.floor(time / 10);
        return Math.max(50, baseScore + levelBonus - timePenalty);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content sequence-game-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 style={{ color: '#ef4444' }}>Memory Sequence</h2>
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
                        🎉 Great job! You completed {level - 1} levels!
                    </div>
                )}

                {!isShowingSequence && gameStarted && !gameCompleted && (
                    <div className="sequence-instructions">
                        <p>Now repeat the sequence by clicking the tiles in the same order.</p>
                    </div>
                )}

                {isShowingSequence && (
                    <div className="sequence-instructions">
                        <p>Watch the sequence...</p>
                    </div>
                )}

                <div className="sequence-game-board">
                    {[0, 1, 2, 3].map((tileIndex) => (
                        <button
                            key={tileIndex}
                            className="sequence-tile"
                            style={{
                                backgroundColor: flashing === tileIndex ? '#FFF' : colors[tileIndex],
                                width: '120px',
                                height: '120px',
                                margin: '10px',
                                border: 'none',
                                borderRadius: '8px',
                                ...(selectedTile === tileIndex ? { boxShadow: '0 0 20px rgba(0,0,0,0.7)' } : {}),
                            }}
                            onClick={() => handleTileClick(tileIndex)}
                            disabled={isShowingSequence || gameCompleted}
                        />
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

export default LogicPuzzle;
