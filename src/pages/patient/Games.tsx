import React, { useState, useEffect } from 'react';
import Navigation from '../../components/common/Navigation';
import { Brain, Zap, Target, MessageSquare, Eye, Play, Award, TrendingUp } from 'lucide-react';
import { dataService } from '../../services/mockDataService';
import './Games.css';

interface GameItem {
    id: string;
    name: string;
    description: string;
    category: 'memory' | 'attention' | 'problem-solving' | 'language' | 'visual-spatial';
    difficulty: 'easy' | 'medium' | 'hard';
    points: number;
    estimatedTime: number;
    icon: React.ReactNode;
    color: string;
    played: boolean;
    bestScore?: number;
}

const Games: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [games, setGames] = useState<GameItem[]>([]);
    const [totalPoints, setTotalPoints] = useState(0);
    const [gamesPlayedCount, setGamesPlayedCount] = useState(0);

    // Initial Game Definitions
    const GAME_DEFINITIONS: GameItem[] = [
        {
            id: '1',
            name: 'Memory Match',
            description: 'Match pairs of cards to improve your memory',
            category: 'memory',
            difficulty: 'easy',
            points: 100,
            estimatedTime: 10,
            icon: <Brain size={32} />,
            color: '#8b5cf6',
            played: false
        },
        {
            id: '2',
            name: 'Word Puzzle',
            description: 'Find hidden words to enhance language skills',
            category: 'language',
            difficulty: 'medium',
            points: 150,
            estimatedTime: 15,
            icon: <MessageSquare size={32} />,
            color: '#3b82f6',
            played: false
        },
        {
            id: '3',
            name: 'Pattern Recognition',
            description: 'Identify patterns to boost visual-spatial skills',
            category: 'visual-spatial',
            difficulty: 'medium',
            points: 150,
            estimatedTime: 12,
            icon: <Eye size={32} />,
            color: '#10b981',
            played: false
        },
        {
            id: '4',
            name: 'Attention Training',
            description: 'Focus exercises to improve concentration',
            category: 'attention',
            difficulty: 'easy',
            points: 100,
            estimatedTime: 8,
            icon: <Zap size={32} />,
            color: '#f59e0b',
            played: false
        },
        {
            id: '5',
            name: 'Logic Puzzles',
            description: 'Solve puzzles to enhance problem-solving abilities',
            category: 'problem-solving',
            difficulty: 'hard',
            points: 200,
            estimatedTime: 20,
            icon: <Target size={32} />,
            color: '#ef4444',
            played: false
        },
        {
            id: '6',
            name: 'Speed Memory',
            description: 'Quick memory challenges for advanced training',
            category: 'memory',
            difficulty: 'hard',
            points: 200,
            estimatedTime: 15,
            icon: <Brain size={32} />,
            color: '#ec4899',
            played: false
        }
    ];

    useEffect(() => {
        loadGameData();
    }, []);

    const loadGameData = () => {
        // Get activities to determine what has been played
        const activities = dataService.getPatientActivities('p1');
        const gameActivities = activities.filter(a => a.type === 'game');

        // Update game states based on history
        const updatedGames = GAME_DEFINITIONS.map(game => {
            const gamePlays = gameActivities.filter(a => a.title.includes(game.name));
            const bestScore = gamePlays.length > 0
                ? Math.max(...gamePlays.map(p => p.score || 0))
                : undefined;

            return {
                ...game,
                played: gamePlays.length > 0,
                bestScore
            };
        });

        setGames(updatedGames);
        setGamesPlayedCount(gameActivities.length);
        setTotalPoints(gameActivities.reduce((acc, a) => acc + (a.score || 0), 0));
    };

    const handlePlayGame = (game: GameItem) => {
        // Simulate playing a game and getting a score
        const score = Math.floor(Math.random() * 50) + game.points; // Random score for demo

        alert(`Simulating game play for "${game.name}"...\n\nGreat job! You scored ${score} points!`);

        dataService.saveGameResult('p1', score, game.name);
        loadGameData(); // Refresh state
    };

    const categories = [
        { id: 'all', name: 'All Games', icon: <Play size={18} /> },
        { id: 'memory', name: 'Memory', icon: <Brain size={18} /> },
        { id: 'attention', name: 'Attention', icon: <Zap size={18} /> },
        { id: 'problem-solving', name: 'Problem Solving', icon: <Target size={18} /> },
        { id: 'language', name: 'Language', icon: <MessageSquare size={18} /> },
        { id: 'visual-spatial', name: 'Visual', icon: <Eye size={18} /> }
    ];

    const filteredGames = selectedCategory === 'all'
        ? games
        : games.filter(game => game.category === selectedCategory);

    const getDifficultyColor = (difficulty: string) => {
        const colors: Record<string, string> = {
            easy: '#10b981',
            medium: '#f59e0b',
            hard: '#ef4444'
        };
        return colors[difficulty];
    };

    return (
        <div className="page-wrapper">
            <Navigation userRole="patient" />

            <div className="page-container">
                <div className="games-header">
                    <div>
                        <h1 className="page-title">Cognitive Games</h1>
                        <p className="page-subtitle">Train your brain with fun and engaging games!</p>
                    </div>
                    <div className="games-stats">
                        <div className="stat-badge">
                            <Play size={20} />
                            <span>{gamesPlayedCount} Games Played</span>
                        </div>
                        <div className="stat-badge">
                            <Award size={20} />
                            <span>{totalPoints} Total Score</span>
                        </div>
                    </div>
                </div>

                {/* Category Filter */}
                <div className="category-filter">
                    {categories.map(category => (
                        <button
                            key={category.id}
                            className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(category.id)}
                        >
                            {category.icon}
                            {category.name}
                        </button>
                    ))}
                </div>

                {/* Games Grid */}
                <div className="games-grid">
                    {filteredGames.map((game) => (
                        <div
                            key={game.id}
                            className="game-card card"
                            style={{ borderTopColor: game.color }}
                        >
                            <div className="game-icon" style={{ backgroundColor: game.color }}>
                                {game.icon}
                            </div>

                            <div className="game-content">
                                <div className="game-header-info">
                                    <h3>{game.name}</h3>
                                    {game.played && (
                                        <span className="played-badge">
                                            <TrendingUp size={14} />
                                            Played
                                        </span>
                                    )}
                                </div>

                                <p className="game-description">{game.description}</p>

                                <div className="game-meta">
                                    <span
                                        className="difficulty-badge"
                                        style={{ backgroundColor: getDifficultyColor(game.difficulty) }}
                                    >
                                        {game.difficulty}
                                    </span>
                                    <span className="category-tag">{game.category}</span>
                                </div>

                                <div className="game-stats-row">
                                    <div className="game-stat">
                                        <Award size={16} />
                                        <span>{game.points} pts</span>
                                    </div>
                                    <div className="game-stat">
                                        <Zap size={16} />
                                        <span>{game.estimatedTime} min</span>
                                    </div>
                                    {game.bestScore && (
                                        <div className="game-stat best-score">
                                            <TrendingUp size={16} />
                                            <span>Best: {game.bestScore}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                className="play-btn"
                                onClick={() => handlePlayGame(game)}
                            >
                                <Play size={20} />
                                {game.played ? 'Play Again' : 'Start Game'}
                            </button>
                        </div>
                    ))}
                </div>

                {filteredGames.length === 0 && (
                    <div className="empty-state">
                        <Brain size={64} />
                        <h3>No games found</h3>
                        <p>Try selecting a different category</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Games;
