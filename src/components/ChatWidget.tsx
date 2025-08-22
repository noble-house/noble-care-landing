import React, { useState } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Hello! I\'m here to help with your questions about Noble Care services. How can I assist you today?',
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  const predefinedQuestions = [
    'What services do you offer?',
    'How much does homecare cost?',
    'Are your caregivers trained?',
    'Do you provide 24/7 care?',
    'What areas do you serve?',
    'How do I get started?'
  ];

  const answers = {
    'What services do you offer?': 'We offer personalized elderly care, post-hospitalization recovery, wellness & nutrition support, skilled nursing, and lifestyle assistance - all with hospitality standards.',
    'How much does homecare cost?': 'Our costs vary based on care needs and hours required. We offer flexible plans starting from ₹15,000/month. Contact us for a personalized quote and free assessment.',
    'Are your caregivers trained?': 'Yes! All our caregivers are professionally trained in healthcare and hospitality standards. They undergo continuous training and background verification.',
    'Do you provide 24/7 care?': 'Absolutely! We provide 24/7 care services and round-the-clock emergency support. Our team is always available when you need us.',
    'What areas do you serve?': 'We currently serve Delhi NCR, Mumbai, Bangalore, Chennai, Pune, and Hyderabad, with plans to expand to more cities soon.',
    'How do I get started?': 'Simply click "Book a Free Consultation" or call us at +918447639569. We\'ll schedule a free assessment and create a personalized care plan.'
  };

  const handleSendMessage = (text: string) => {
    const userMessage = {
      id: messages.length + 1,
      text,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: answers[text as keyof typeof answers] || 'Thank you for your question! For detailed information, please call us at +918447639569 or book a free consultation.',
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      handleSendMessage(inputValue);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-50 ${isOpen ? 'hidden' : 'flex'} items-center justify-center`}
      >
        <MessageCircle className="w-8 h-8" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Noble Care Support</h3>
                <p className="text-sm opacity-90">Online now</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors duration-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="h-80 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    message.isBot
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Predefined Questions */}
          <div className="p-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">Quick questions:</p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {predefinedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(question)}
                  className="w-full text-left text-sm bg-gray-50 hover:bg-blue-50 hover:text-blue-600 p-2 rounded-lg transition-colors duration-300"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl flex items-center justify-center transition-colors duration-300"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatWidget;