import { useState, useRef, useEffect } from 'react';
import apiClient from '../services/api';

export default function AiAssistant({ courseId, moduleId }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'ai', text: 'Hi! I can help you with questions about this course. What would you like to know?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const response = await apiClient.post('/api/ai/chat', {
                question: userMsg.text,
                courseId,
                moduleId // Optional specific context
            });

            const aiMsg = { role: 'ai', text: response.data.data.answer };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'error', text: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={styles.triggerBtn}
            >
                {isOpen ? '❌' : '🤖 AI Help'}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div style={styles.chatWindow}>
                    <div style={styles.header}>
                        <h3>AI Learning Assistant 🧠</h3>
                        <span style={styles.status}>Online</span>
                    </div>

                    <div style={styles.messagesArea}>
                        {messages.map((msg, idx) => (
                            <div key={idx} style={{
                                ...styles.messageBubble,
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                background: msg.role === 'user' ? '#667eea' : '#edf2f7',
                                color: msg.role === 'user' ? 'white' : '#2d3748',
                            }}>
                                {msg.text}
                            </div>
                        ))}
                        {loading && <div style={styles.typingIndicator}>Thinking...</div>}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSend} style={styles.inputArea}>
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question..."
                            style={styles.input}
                            disabled={loading}
                        />
                        <button type="submit" disabled={loading} style={styles.sendBtn}>➤</button>
                    </form>
                </div>
            )}
        </>
    );
}

const styles = {
    triggerBtn: { position: 'fixed', bottom: '2rem', right: '2rem', padding: '1rem 1.5rem', borderRadius: '30px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', zIndex: 1000 },
    chatWindow: { position: 'fixed', bottom: '6rem', right: '2rem', width: '350px', height: '500px', background: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', zIndex: 1000, overflow: 'hidden', border: '1px solid #e2e8f0' },
    header: { padding: '1rem', background: '#f7fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    status: { fontSize: '12px', color: '#48bb78', fontWeight: 'bold' },
    messagesArea: { flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    messageBubble: { maxWidth: '85%', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '14px', lineHeight: '1.4' },
    typingIndicator: { alignSelf: 'flex-start', color: '#a0aec0', fontSize: '12px', paddingLeft: '0.5rem' },
    inputArea: { padding: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem' },
    input: { flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' },
    sendBtn: { padding: '0.75rem 1rem', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
};
