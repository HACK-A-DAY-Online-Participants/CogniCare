import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getGeminiResponse } from '../../services/gemini';
import './VoiceAgent.css';

// Add type definition for Web Speech API
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

interface VoiceAgentProps {
    showStatus?: boolean;
}

const VoiceAgent: React.FC<VoiceAgentProps> = ({ showStatus = true }) => {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [statusText, setStatusText] = useState("Tap to speak");

    const navigate = useNavigate();
    const recognitionRef = useRef<any>(null);
    const synthesisRef = useRef<SpeechSynthesis>(window.speechSynthesis);

    useEffect(() => {
        // Initialize Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onstart = () => {
                setIsListening(true);
                setStatusText("Listening...");
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
                if (!isSpeaking) {
                    setStatusText("Tap to speak");
                }
            };

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                handleUserQuery(transcript);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
                setStatusText("Error. Try again.");
            };
        } else {
            setStatusText("Voice not supported");
        }

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {
                    // Ignore
                }
            }
            if (synthesisRef.current) {
                synthesisRef.current.cancel();
            }
        };
    }, []);

    const handleUserQuery = async (query: string) => {
        console.log("User said:", query);
        setStatusText("Thinking...");

        // Simple client-side routing logic (can be moved to LLM later with function calling)
        const lowerQuery = query.toLowerCase();
        if (lowerQuery.includes('game')) {
            navigate('/patient/games');
            speakResponse("I'm taking you to the games section. Have fun!");
            return;
        }
        if (lowerQuery.includes('task')) {
            navigate('/patient/tasks');
            speakResponse("Here are your tasks for today.");
            return;
        }
        if (lowerQuery.includes('dashboard') || lowerQuery.includes('home')) {
            navigate('/patient');
            speakResponse("Going back to the dashboard.");
            return;
        }

        // Use Gemini for general queries
        const context = "User is on the Patient Dashboard. They have completed 3 tasks today and have a streak of 5 days.";
        const response = await getGeminiResponse(query, context);
        speakResponse(response);
    };

    const speakResponse = (text: string) => {
        if (!synthesisRef.current) return;

        synthesisRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;

        const voices = synthesisRef.current.getVoices();
        const soothingVoice = voices.find(voice => voice.name.includes('Female') || voice.name.includes('Google US English'));
        if (soothingVoice) {
            utterance.voice = soothingVoice;
        }

        utterance.onstart = () => {
            setIsSpeaking(true);
            setStatusText("Speaking...");
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            setStatusText("Tap to speak");
        };

        synthesisRef.current.speak(utterance);
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            if (isSpeaking) {
                synthesisRef.current.cancel();
                setIsSpeaking(false);
            }
            try {
                recognitionRef.current?.start();
            } catch (e) {
                console.error("Failed to start recognition", e);
            }
        }
    };

    return (
        <div className="voice-agent-container">
            {showStatus && (
                <div className={`voice-status ${isListening ? 'listening' : isSpeaking ? 'speaking' : ''}`}>
                    {statusText}
                </div>
            )}

            <button
                className={`voice-btn ${isListening ? 'listening' : isSpeaking ? 'speaking' : 'idle'}`}
                onClick={toggleListening}
                title={isListening ? "Stop listening" : "Start voice assistant"}
            >
                {isListening ? (
                    <MicOff size={20} />
                ) : isSpeaking ? (
                    <div className="wave-container">
                        <div className="wave-bar"></div>
                        <div className="wave-bar"></div>
                        <div className="wave-bar"></div>
                        <div className="wave-bar"></div>
                        <div className="wave-bar"></div>
                    </div>
                ) : (
                    <Mic size={20} />
                )}
            </button>
        </div>
    );
};

export default VoiceAgent;
