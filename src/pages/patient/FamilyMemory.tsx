import React, { useState, useEffect } from 'react';
import { X, RotateCcw, Check, X as Wrong } from 'lucide-react';

// Sample family data - you'll need to replace with actual images
interface FamilyMember {
    id: number;
    name: string;
    image: string;
    isMatched: boolean;
    isFlipped: boolean;
}

interface FamilyMemoryProps {
    onClose: () => void;
    onGameComplete: (score: number) => void;
}

const FamilyMemory: React.FC<FamilyMemoryProps> = ({ onClose, onGameComplete }) => {
    const [cards, setCards] = useState<FamilyMember[]>([]);
    const [nameOptions, setNameOptions] = useState<string[]>([]);
    const [selectedCard, setSelectedCard] = useState<number | null>(null);
    const [moves, setMoves] = useState(0);
    const [time, setTime] = useState(0);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameCompleted, setGameCompleted] = useState(false);
    const [showNameSelection, setShowNameSelection] = useState(false);
    const [feedback, setFeedback] = useState<{show: boolean, correct: boolean}>({show: false, correct: false});

    // Family member data - updated to match the actual filenames you uploaded
    const familyMembers = [
        { name: 'Chandan', image: '/family-chandan.jpg.png' },
        { name: 'Jhenkar', image: '/family-jhenkar.jpg.jpg' },
        { name: 'PranavM', image: '/family-pranavm.jpg.jpg' },
        { name: 'Rethash', image: '/family-rethash.jpg.jpg' }
    ];

    const availableNames = ['PranavM', 'Rethash', 'Jhenkar', 'Chandan'];

    const initializeGame = () => {
        // Create one card per family member
        const gameCards = familyMembers.map((member, index) => ({
            id: index,
            name: member.name,
            image: member.image,
            isMatched: false,
            isFlipped: true
        }));

        // Shuffle the cards
        const shuffled = [...gameCards].sort(() => Math.random() - 0.5);

        setCards(shuffled);
        setNameOptions(availableNames);
        setSelectedCard(null);
        setMoves(0);
        setTime(0);
        setGameStarted(false);
        setGameCompleted(false);
        setShowNameSelection(false);
        setFeedback({show: false, correct: false});
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

    const handleCardClick = (cardIndex: number) => {
        if (!gameStarted) setGameStarted(true);
        if (selectedCard === null) {
            // First card selected
            setSelectedCard(cardIndex);
            setShowNameSelection(true);
        }
    };

    const handleNameSelect = (selectedName: string) => {
        if (selectedCard === null) return;

        const correctName = cards[selectedCard].name;
        const isCorrect = selectedName === correctName;

        setMoves(prev => prev + 1);
        setFeedback({show: true, correct: isCorrect});

        if (isCorrect) {
            // Correct match
            setCards(prev => prev.map((card, index) =>
                index === selectedCard
                    ? { ...card, isMatched: true, isFlipped: false }
                    : card
            ));
        }

        // Hide feedback after 1.5 seconds
        setTimeout(() => {
            setFeedback({show: false, correct: false});
            setSelectedCard(null);
            setShowNameSelection(false);
        }, 1500);
    };

    useEffect(() => {
        // Check if game is completed
        if (cards.length > 0 && cards.every(card => card.isMatched)) {
            const score = calculateScore(moves, time);
            setGameCompleted(true);
            setTimeout(() => {
                onGameComplete(score);
                onClose();
            }, 2500);
        }
    }, [cards, moves, time, onClose, onGameComplete]);

    const calculateScore = (moves: number, time: number): number => {
        // Base score of 250 for family memory, reduced by incorrect moves and time
        const baseScore = 250;
        const incorrectMoves = Math.max(0, moves - familyMembers.length); // One move per pair is correct
        const penalty = incorrectMoves * 15 + Math.floor(time / 8);
        return Math.max(75, baseScore - penalty);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content family-memory-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 style={{ color: '#3b82f6' }}>Family Memory</h2>
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
                        🎉 Wonderful! You remembered your family perfectly!
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
                                <Wrong size={24} />
                                <span>Not quite right. Try again!</span>
                            </>
                        )}
                    </div>
                )}

                <div className="family-memory-board">
                    {cards.map((card, index) => (
                        <div
                            key={card.id}
                            className={`family-card ${card.isMatched ? 'matched' : ''} ${selectedCard === index ? 'selected' : ''} ${card.isFlipped ? 'flipped' : ''}`}
                            onClick={() => handleCardClick(index)}
                        >
                            {card.isFlipped && (
                                <div className="family-card-image">
                                    <img src={card.image} alt="Family member" />
                                </div>
                            )}
                            {card.isMatched && (
                                <div className="matched-overlay">
                                    <Check size={32} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {showNameSelection && selectedCard !== null && (
                    <div className="name-selection-panel">
                        <h3>Who is this?</h3>
                        <div className="name-options-grid">
                            {nameOptions.map((name) => (
                                <button
                                    key={name}
                                    className="name-option-btn"
                                    onClick={() => handleNameSelect(name)}
                                    disabled={feedback.show}
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

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

export default FamilyMemory;
