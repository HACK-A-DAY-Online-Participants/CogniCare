import React, { useState } from 'react';
import Navigation from '../../components/common/Navigation';
import { Plus, Heart, Calendar, Smile } from 'lucide-react';
import './MemoryBoard.css';

interface Memory {
    id: string;
    imageUrl: string;
    title: string;
    date: string;
    description: string;
    people: string[];
    emotion: 'happy' | 'neutral' | 'nostalgic';
}

const MemoryBoard: React.FC = () => {
    const [selectedEmotion, setSelectedEmotion] = useState<string>('all');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [memories, setMemories] = useState<Memory[]>([
        {
            id: '1',
            imageUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=500',
            title: 'Family Picnic',
            date: 'Summer 2023',
            description: 'A wonderful day at the park with the grandkids.',
            people: ['Sarah', 'Mike', 'Emma'],
            emotion: 'happy'
        },
        {
            id: '2',
            imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500',
            title: 'Old Friends',
            date: 'Christmas 2022',
            description: 'Reunion with high school friends.',
            people: ['Robert', 'James'],
            emotion: 'nostalgic'
        },
        {
            id: '3',
            imageUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500',
            title: 'Gardening',
            date: 'Spring 2024',
            description: 'My prize-winning roses finally bloomed!',
            people: [],
            emotion: 'happy'
        },
        {
            id: '4',
            imageUrl: 'https://images.unsplash.com/photo-1516737488439-c3f589534792?w=500',
            title: 'Paris Trip',
            date: '1998',
            description: 'Visiting the Eiffel Tower.',
            people: ['Martha'],
            emotion: 'nostalgic'
        }
    ]);

    const [newMemory, setNewMemory] = useState<Partial<Memory>>({
        title: '',
        date: '',
        description: '',
        people: [],
        emotion: 'happy',
        imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500' // Default placeholder
    });

    const handleAddMemory = () => {
        if (!newMemory.title || !newMemory.date) return;

        const memory: Memory = {
            id: Date.now().toString(),
            imageUrl: newMemory.imageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
            title: newMemory.title,
            date: newMemory.date,
            description: newMemory.description || '',
            people: typeof newMemory.people === 'string' ? (newMemory.people as string).split(',').map((p: string) => p.trim()) : [],
            emotion: newMemory.emotion as 'happy' | 'neutral' | 'nostalgic'
        };

        setMemories([memory, ...memories]);
        setIsModalOpen(false);
        setNewMemory({
            title: '',
            date: '',
            description: '',
            people: [],
            emotion: 'happy',
            imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500'
        });
    };

    const filteredMemories = selectedEmotion === 'all'
        ? memories
        : memories.filter(m => m.emotion === selectedEmotion);

    return (
        <div className="page-wrapper">
            <Navigation userRole="patient" />

            <div className="page-container">
                <div className="memory-header">
                    <div>
                        <h1 className="page-title">Memory Board</h1>
                        <p className="page-subtitle">Cherished moments and familiar faces</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={20} />
                        Add Memory
                    </button>
                </div>

                {/* Mood/Filter Selector */}
                <div className="mood-filters">
                    <button
                        className={`filter-chip ${selectedEmotion === 'all' ? 'active' : ''}`}
                        onClick={() => setSelectedEmotion('all')}
                    >
                        All Memories
                    </button>
                    <button
                        className={`filter-chip ${selectedEmotion === 'happy' ? 'active' : ''}`}
                        onClick={() => setSelectedEmotion('happy')}
                    >
                        <Smile size={18} /> Happy
                    </button>
                    <button
                        className={`filter-chip ${selectedEmotion === 'nostalgic' ? 'active' : ''}`}
                        onClick={() => setSelectedEmotion('nostalgic')}
                    >
                        <Heart size={18} /> Nostalgic
                    </button>
                </div>

                {/* Masonry Grid */}
                <div className="memory-grid">
                    {filteredMemories.map((memory) => (
                        <div key={memory.id} className="memory-card card">
                            <div className="memory-image-container">
                                <img src={memory.imageUrl} alt={memory.title} className="memory-image" />
                                <div className="memory-overlay">
                                    <span className="memory-date">
                                        <Calendar size={14} />
                                        {memory.date}
                                    </span>
                                </div>
                            </div>

                            <div className="memory-content">
                                <div className="memory-header-row">
                                    <h3>{memory.title}</h3>
                                    {memory.emotion === 'happy' && <Smile size={20} className="text-success" />}
                                    {memory.emotion === 'nostalgic' && <Heart size={20} className="text-primary" />}
                                </div>

                                <p className="memory-description">{memory.description}</p>

                                {memory.people.length > 0 && (
                                    <div className="memory-people">
                                        <span className="people-label">Recognized:</span>
                                        <div className="people-tags">
                                            {memory.people.map((person, idx) => (
                                                <span key={idx} className="person-tag">
                                                    {person}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {
                isModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content card">
                            <h2 className="text-xl font-bold mb-4">Add New Memory</h2>
                            <div className="form-group mb-4">
                                <label className="block text-sm font-medium mb-1">Title</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded"
                                    value={newMemory.title}
                                    onChange={e => setNewMemory({ ...newMemory, title: e.target.value })}
                                    placeholder="e.g., Birthday Party"
                                />
                            </div>
                            <div className="form-group mb-4">
                                <label className="block text-sm font-medium mb-1">Date</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded"
                                    value={newMemory.date}
                                    onChange={e => setNewMemory({ ...newMemory, date: e.target.value })}
                                    placeholder="e.g., Summer 2024"
                                />
                            </div>
                            <div className="form-group mb-4">
                                <label className="block text-sm font-medium mb-1">Image</label>
                                <div className="flex flex-col gap-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="w-full p-2 border rounded"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setNewMemory({ ...newMemory, imageUrl: reader.result as string });
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                    {newMemory.imageUrl && (
                                        <div className="relative w-full h-32 bg-gray-100 rounded overflow-hidden">
                                            <img
                                                src={newMemory.imageUrl}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="form-group mb-4">
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    className="w-full p-2 border rounded"
                                    value={newMemory.description}
                                    onChange={e => setNewMemory({ ...newMemory, description: e.target.value })}
                                    placeholder="What happened?"
                                />
                            </div>
                            <div className="form-group mb-4">
                                <label className="block text-sm font-medium mb-1">Emotion</label>
                                <select
                                    className="w-full p-2 border rounded"
                                    value={newMemory.emotion}
                                    onChange={e => setNewMemory({ ...newMemory, emotion: e.target.value as any })}
                                >
                                    <option value="happy">Happy</option>
                                    <option value="nostalgic">Nostalgic</option>
                                    <option value="neutral">Neutral</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleAddMemory}
                                >
                                    Save Memory
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default MemoryBoard;
