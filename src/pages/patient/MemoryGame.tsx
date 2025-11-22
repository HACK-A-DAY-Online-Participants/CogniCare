import React, { useState, useEffect } from 'react';
import { X, RotateCcw } from 'lucide-react';

interface MemoryGameProps {
    onClose: () => void;
    onGameComplete: (score: number) => void;
}

interface Card {
    id: number;
    value: string;
    isFlipped: boolean;
    isMatched: boolean;
}

const MemoryGame: React.FC<MemoryGameProps> = ({ onClose, onGameComplete }) => {
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const [time, setTime] = useState(0);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameCompleted, setGameCompleted] = useState(false);

    // Memory game card values (emojis)
    const cardValues = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸'];

    const initializeGame = () => {
        const shuffledCards = [...cardValues, ...cardValues]
            .sort(() => Math.random() - 0.5)
            .map((value, index) => ({
                id: index,
                value,
                isFlipped: false,
                isMatched: false
            }));
        setCards(shuffledCards);
        setFlippedCards([]);
        setMoves(0);
        setTime(0);
        setGameStarted(false);
        setGameCompleted(false);
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

    useEffect(() => {
        if (flippedCards.length === 2) {
            const [first, second] = flippedCards;
            if (cards[first].value === cards[second].value) {
                // Match found
                setCards(prev => prev.map((card, index) =>
                    index === first || index === second
                        ? { ...card, isMatched: true }
                        : card
                ));
                setFlippedCards([]);
            } else {
                // No match, flip back after delay
                setTimeout(() => {
                    setCards(prev => prev.map((card, index) =>
                        index === first || index === second
                            ? { ...card, isFlipped: false }
                            : card
                    ));
                    setFlippedCards([]);
                }, 1000);
            }
            setMoves(prev => prev + 1);
        }
    }, [flippedCards, cards]);

    useEffect(() => {
        // Check if game is completed
        if (cards.length > 0 && cards.every(card => card.isMatched)) {
            const score = calculateScore(moves, time);
            setGameCompleted(true);
            setTimeout(() => {
                onGameComplete(score);
                onClose();
            }, 2000);
        }
    }, [cards, moves, time, onClose, onGameComplete]);

    const calculateScore = (moves: number, time: number): number => {
        // Base score of 200, reduced by moves and time penalties
        const baseScore = 200;
        const movePenalty = moves * 2;
        const timePenalty = Math.floor(time / 10);
        return Math.max(50, baseScore - movePenalty - timePenalty);
    };

    const handleCardClick = (index: number) => {
        if (!gameStarted) {
            setGameStarted(true);
        }
        if (flippedCards.length >= 2) return;
        if (cards[index].isFlipped || cards[index].isMatched) return;

        setCards(prev => prev.map((card, i) =>
            i === index ? { ...card, isFlipped: true } : card
        ));
        setFlippedCards(prev => [...prev, index]);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 style={{ color: '#8b5cf6' }}>Memory Match</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="memory-game-stats">
                    <div className="stat-item">
                        <span className="stat-label">Moves:</span>
                        <span className="stat-value">{moves}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Time:</span>
                        <span className="stat-value">{formatTime(time)}</span>
                    </div>
                </div>

                {gameCompleted && (
                    <div className="game-completed-message">
                        🎉 Congratulations! Memory Match Completed!
                    </div>
                )}

                <div className="memory-game-board">
                    {cards.map((card, index) => (
                        <button
                            key={card.id}
                            className={`memory-card ${card.isFlipped || card.isMatched ? 'flipped' : ''} ${card.isMatched ? 'matched' : ''}`}
                            onClick={() => handleCardClick(index)}
                            disabled={card.isMatched || gameCompleted}
                        >
                            <div className="card-inner">
                                <div className="card-face card-back">?</div>
                                <div className="card-face card-front">{card.value}</div>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="memory-game-actions">
                    <button className="btn btn-secondary" onClick={initializeGame}>
                        <RotateCcw size={16} />
                        Restart Game
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MemoryGame;
