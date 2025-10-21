import React, { useState, useEffect, useRef } from 'react';
import { User, Copy, ArrowUp, ChevronDown } from 'lucide-react';
import { parseMarkdown } from '../utils/markdown';

const ChatInterface = ({ currentChat, handleUserSubmit }) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState('openai/gpt-3.5-turbo');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [modelSwitchMessage, setModelSwitchMessage] = useState('');
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null); // Ref for event delegation
  const textareaRef = useRef(null);
  const modelSelectorRef = useRef(null);

  // Free OpenRouter models
  const freeModels = [
    { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B Instruct' },
    { id: 'meta-llama/llama-3.2-1b-instruct:free', name: 'Llama 3.2 1B Instruct' },
    { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B Instruct' },
    { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2 9B' },
    { id: 'microsoft/phi-3-mini-128k-instruct:free', name: 'Phi-3 Mini' },
    { id: 'microsoft/phi-3-medium-128k-instruct:free', name: 'Phi-3 Medium' },
    { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B Instruct' },
    { id: 'qwen/qwen-2-7b-instruct:free', name: 'Qwen 2 7B Instruct' },
    { id: 'google/gemini-flash-1.5', name: 'Gemini Flash 1.5' },
  ];

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [inputText]);

  // Handle click outside model selector
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modelSelectorRef.current && !modelSelectorRef.current.contains(event.target)) {
        setShowModelSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear model switch message after 3 seconds
  useEffect(() => {
    if (modelSwitchMessage) {
      const timer = setTimeout(() => {
        setModelSwitchMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [modelSwitchMessage]);

  // Handle model selection
  const handleModelChange = (modelId) => {
    const model = freeModels.find(m => m.id === modelId);
    setSelectedModel(modelId);
    setShowModelSelector(false);
    setModelSwitchMessage(`Switched to ${model.name}`);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if(currentChat) {
      scrollToBottom();
    }
  }, [currentChat?.messages]);

  // Handle copy functionality
  const handleCopyMessage = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add toast notification here if implemented
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Effect for handling copy button clicks via event delegation
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleCopyClick = (e) => {
        const button = e.target.closest('.copy-code-btn');
        if (button) {
            const container = button.closest('.code-block-container');
            const pre = container?.querySelector('pre');
            if (pre) {
                navigator.clipboard.writeText(pre.innerText)
                  .then(() => {
                      const copyText = button.querySelector('.copy-text');
                      if (copyText) {
                        copyText.textContent = 'Copied!';
                        setTimeout(() => {
                          copyText.textContent = 'Copy';
                        }, 2000);
                      }
                  })
                  .catch(err => console.error('Failed to copy text: ', err));
            }
        }

        // Handle message copy buttons
        const copyMessageBtn = e.target.closest('.copy-message-btn');
        if (copyMessageBtn) {
          const messageElement = copyMessageBtn.closest('.message-container');
          if (messageElement) {
            const text = messageElement.getAttribute('data-message-text');
            handleCopyMessage(text);
          }
        }
    };

    container.addEventListener('click', handleCopyClick);

    return () => {
        container.removeEventListener('click', handleCopyClick);
    };
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inputText.trim() === '' || isTyping) return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsTyping(true);

    await handleUserSubmit(userMessage, selectedModel);

    setIsTyping(false);
  };

  const isNewChat = !currentChat;

  return (
    <div className="flex flex-col h-full bg-black">
      <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {isNewChat ? (
           <div className="flex h-full flex-col items-center justify-center text-center">
             <div className="w-16 h-16 rounded-full bg-gray-950 flex items-center justify-center mb-4 border-2 border-gray-700">
                <User size={32} className="text-white"/>
            </div>
            <h2 className="text-2xl font-semibold text-gray-300">Ready when you are.</h2>
          </div>
        ) : (
          <>
            {currentChat.messages.map((msg, index) => (
              <div key={index} className={`flex items-start gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`message-container max-w-2xl text-white relative group ${
                    msg.role === 'user' ? 'bg-gray-800 p-3 rounded-xl' : ''
                  }`}
                  data-message-text={msg.content}
                >
                  <button
                    className="copy-message-btn absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded cursor-pointer"
                    onClick={() => handleCopyMessage(msg.content)}
                    aria-label="Copy message"
                  >
                    <Copy size={14} />
                  </button>
                  {msg.role === 'user' ? (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                      <div
                          className="text-base leading-relaxed whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
                      />
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-start gap-4 max-w-4xl mx-auto justify-start">
                <div className="max-w-xl">
                  <p className="text-sm text-gray-400 italic">thinking...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      <div className="px-4 pb-4 w-full flex-shrink-0">
        {/* Model switch message */}
        {modelSwitchMessage && (
          <div className="max-w-4xl mx-auto mb-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg text-center">
            <p className="text-sm text-blue-300">{modelSwitchMessage}</p>
          </div>
        )}
        
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center max-w-4xl mx-auto bg-gray-900 border border-gray-700 rounded-2xl shadow-lg"
        >
          {/* Model Selector */}
          <div className="relative" ref={modelSelectorRef}>
            <button
              type="button"
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="ml-3 px-3 py-2 text-xs text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center gap-2 transition-colors border border-gray-600"
              disabled={isTyping}
            >
              <span className="max-w-[120px] truncate">
                {freeModels.find(m => m.id === selectedModel)?.name || 'Select Model'}
              </span>
              <ChevronDown size={14} className={`transition-transform ${showModelSelector ? 'rotate-180' : ''}`} />
            </button>
            
            {showModelSelector && (
              <div className="absolute bottom-full mb-2 left-3 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 max-h-72 overflow-y-auto">
                <div className="p-2">
                  <p className="text-xs text-gray-400 px-2 py-1 font-semibold">Free Models</p>
                  {freeModels.map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => handleModelChange(model.id)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                        selectedModel === model.id
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {model.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                }
            }}
            placeholder="Ask anything..."
            className="flex-grow w-full pl-4 pr-12 py-3 bg-transparent focus:outline-none text-sm text-white resize-none overflow-y-auto scrollbar-hide"
            rows="1"
            disabled={isTyping}
            style={{maxHeight: '200px'}}
          />
          <button
            type="submit"
            className={`absolute right-3 bottom-2 p-2 rounded-full transition-colors  ${
                (inputText.trim() && !isTyping)
                ? 'bg-white text-black'
                : 'bg-gray-700 text-white'
            } disabled:bg-gray-800 disabled:cursor-not-allowed`}
            disabled={inputText.trim() === '' || isTyping}
          >
            <ArrowUp size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
