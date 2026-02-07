import { useState } from 'react';
import api from '../api';
import { MessageCircle, X } from 'lucide-react'; // Needs 'lucide-react' npm package

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ sender: 'bot', text: 'Hi! I help you negotiate contracts. Ask me anything.' }]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    if (!input) return;
    const userMsg = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    try {
      const res = await api.post('/chat', { message: input });
      setMessages(prev => [...prev, { sender: 'bot', text: res.data.response }]);
    } catch (e) {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Error connecting to AI.' }]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {isOpen && (
        <div className="bg-white w-80 h-96 rounded-xl shadow-2xl border flex flex-col overflow-hidden">
          <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
            <h3 className="font-bold">Negotiation AI</h3>
            <button onClick={() => setIsOpen(false)}><X size={18} /></button>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-2 rounded-lg max-w-[80%] text-sm ${m.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t bg-white flex">
            <input 
              className="flex-1 border rounded-l px-3 py-2 text-sm focus:outline-none"
              placeholder="Ask about cancelling..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && sendMessage()}
            />
            <button onClick={sendMessage} className="bg-indigo-600 text-white px-3 rounded-r text-sm">Send</button>
          </div>
        </div>
      )}
    </div>
  );
}