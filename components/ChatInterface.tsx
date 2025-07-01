
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as Api from '../services/api';
import { ChatMessage, User } from '../types';
import Button from './ui/Button';
import Input from './ui/Input';
import { AI_BOT_ID, AI_BOT_NAME } from '../constants';
import LoadingSpinner from './ui/LoadingSpinner';

interface ChatInterfaceProps {
  contactUser: User | null; 
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ contactUser }) => {
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isBotReplying, setIsBotReplying] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const chatId = currentUser && contactUser ? [currentUser.id, contactUser.id].sort().join('_') : null;

  useEffect(() => {
    if (chatId && currentUser) {
      setLoadingMessages(true);
      Api.getChatMessages(chatId)
        .then(setMessages)
        .catch(console.error)
        .finally(() => setLoadingMessages(false));
    } else {
      setMessages([]);
    }
  }, [chatId, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !contactUser || !chatId) return;

    const sentMessageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately

    try {
      // Optimistically add user's message to UI and save it
      const userMsgPayload: Omit<ChatMessage, 'id' | 'timestamp'> = { // Temp payload for optimistic update
          chatId,
          senderId: currentUser.id,
          receiverId: contactUser.id,
          text: sentMessageText,
      };
      // For optimistic UI update, create a temporary message object
      const tempUserMessage: ChatMessage = {
          ...userMsgPayload,
          id: `temp-${Date.now()}`, // Temporary ID
          timestamp: Date.now(),
      };
      setMessages(prev => [...prev, tempUserMessage]);


      const savedUserMessage = await Api.sendChatMessage(chatId, currentUser.id, contactUser.id, sentMessageText);
      // Replace temp message with actual saved message if IDs differ or simply ensure it's there
      setMessages(prev => prev.map(m => m.id === tempUserMessage.id ? savedUserMessage : m));


      // If chatting with AI Bot, get bot's response
      if (contactUser.id === AI_BOT_ID) {
        setIsBotReplying(true);
        const botResponseText = await Api.getAIResponseFromBot(sentMessageText, currentUser.id);
        const botMessage = await Api.sendChatMessage(chatId, AI_BOT_ID, currentUser.id, botResponseText);
        if (botMessage) {
          setMessages(prev => [...prev, botMessage]);
        }
        setIsBotReplying(false);
      }
    } catch (error) {
      console.error("Failed to send message or get bot response:", error);
      // Add notification for user: useNotification().addNotification('Failed to send message.', 'error');
      // Potentially remove optimistic message or mark as failed
       setIsBotReplying(false); // Ensure loading state is cleared on error
    }
  };

  if (!currentUser || !contactUser) {
    return <div className="text-center p-8 text-slate-500">Select a contact to start chatting.</div>;
  }
  
  if (loadingMessages) {
    return <div className="text-center p-8 text-slate-500"><LoadingSpinner color="text-hnai-teal-dark" /> Loading messages...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-250px)] bg-white shadow-lg rounded-lg">
       <div className="p-4 border-b border-slate-200 bg-slate-50 rounded-t-lg">
        <h2 className="text-xl font-semibold text-hnai-teal-dark">Chat with {contactUser.name}</h2>
        {contactUser.id === AI_BOT_ID && <p className="text-xs text-hnai-teal-focus">Powered by Gemini</p>}
      </div>
      <div className="flex-grow p-4 space-y-4 overflow-y-auto">
        {messages.length === 0 && !isBotReplying && <p className="text-slate-500 text-center">No messages yet. Start the conversation!</p>}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow ${
                msg.senderId === currentUser.id
                  ? 'bg-hnai-teal-dark text-white'
                  : msg.senderId === AI_BOT_ID 
                  ? 'bg-hnai-gold text-hnai-gold-text' 
                  : 'bg-slate-200 text-slate-800'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              <p className={`text-xs mt-1 ${
                  msg.senderId === currentUser.id ? 'text-slate-200' // Lighter text on dark teal
                  : msg.senderId === AI_BOT_ID ? 'text-hnai-gold-text opacity-75' // Darker text on gold
                  : 'text-slate-500'} text-right`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isBotReplying && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow bg-hnai-gold text-hnai-gold-text">
              <div className="flex items-center">
                <LoadingSpinner size="sm" color="text-hnai-gold-text" />
                <span className="ml-2 text-sm italic">{AI_BOT_NAME} is typing...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-lg">
        <div className="flex space-x-2">
          <Input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow"
            aria-label="Chat message input"
            disabled={isBotReplying && contactUser.id === AI_BOT_ID}
          />
          <Button type="submit" disabled={!newMessage.trim() || (isBotReplying && contactUser.id === AI_BOT_ID)}>Send</Button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;