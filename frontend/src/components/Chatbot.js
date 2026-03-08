import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Chatbot.css';

function Chatbot({ onExpenseChange }) {
  const [messages, setMessages] = useState([
    { type: 'bot', text: "Hi! I'm your AI expense assistant. Try: 'I spent $45 on groceries' or 'How much did I spend on food this month?'" }
  ]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(
        'http://localhost:5000/api/chat',
        { message: userMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIsTyping(false);
      setMessages(prev => [...prev, { type: 'bot', text: data.response }]);
      
      if (data.data && onExpenseChange) {
        onExpenseChange();
      }
    } catch (err) {
      setIsTyping(false);
      setMessages(prev => [...prev, { type: 'bot', text: 'Sorry, I encountered an error. Please try again.' }]);
    }
  };

  const quickActions = [
    "How much did I spend this month?",
    "Show my biggest expenses",
    "Give me insights",
    "Am I on track with my budget?"
  ];

  return (
    <>
      <button className="chat-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '✕' : '💬'}
      </button>

      {isOpen && (
        <div className="chatbot">
          <div className="chat-header">
            <h3>🤖 AI Assistant</h3>
          </div>

          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.type}`}>
                <div className="message-content">{msg.text}</div>
              </div>
            ))}
            {isTyping && (
              <div className="message bot">
                <div className="message-content typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="quick-actions">
            {quickActions.map((action, i) => (
              <button key={i} onClick={() => setInput(action)} className="quick-btn">
                {action}
              </button>
            ))}
          </div>

          <form onSubmit={sendMessage} className="chat-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
            />
            <button type="submit">Send</button>
          </form>
        </div>
      )}
    </>
  );
}

export default Chatbot;
