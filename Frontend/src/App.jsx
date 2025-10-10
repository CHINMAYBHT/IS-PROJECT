import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, LogOut, Plus, Trash2, Pencil, Eye, EyeOff, Lock, X, AlertTriangle, Menu, ArrowUp, MoreHorizontal, Copy } from 'lucide-react';
import logo from './assets/logo.png';

// Utility: Simulate UUID generation
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// --- SIMULATED DATA & LOGIC ---

// Simple password strength check simulation
const getPasswordStrength = (password) => {
  if (password.length < 6) return { text: "Too Short", color: "text-red-400" };
  if (password.length < 10) return { text: "Weak", color: "text-yellow-400" };
  if (/[A-Z]/.test(password) && /\d]/.test(password) && /[!@#$%^&*]/.test(password)) {
    return { text: "Strong", color: "text-green-400" };
  }
  return { text: "Moderate", color: "text-blue-400" };
};

// --- GEMINI API INTEGRATION ---
// IMPORTANT: In a real-world application, this API key should be stored securely in an environment variable on the server-side.
// Exposing it on the client-side like this is insecure and only for demonstration purposes.
const API_KEY = "AIzaSyC_NgFyTbBN3OGDOjaJpBcRzLGuFVMUG5Q";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;

const generateAiResponse = async (userMessage, chatHistory) => {
  try {
    // Format chat history for the Gemini API. The API expects a specific role format ('model' for AI, 'user' for user).
    const contents = [
      ...chatHistory.map(msg => ({
        role: msg.role === 'ai' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })),
       // The user message is already in the history, so no need to add it again
    ];

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contents }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error("API Error Response:", errorBody);
      throw new Error(`API request failed with status ${response.status}. See console for details.`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return "Sorry, I couldn't generate a valid response. The model may have returned empty content.";
    }
    return text;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return `There was an error connecting to the AI. Please check the console and ensure your API key is valid and has the necessary permissions. \n\n**Error:** ${error.message}`;
  }
};

// --- MARKDOWN PARSER ---
const parseMarkdown = (text) => {
  // First, split by code blocks to isolate them from other markdown parsing
  const parts = text.split(/(```[\s\S]*?```)/g);

  const processedParts = parts.map(part => {
    // If the part is a code block, format it as a styled container
    if (part.startsWith('```')) {
      const lang = part.match(/```(\w*)/)?.[1] || 'code';
      const code = part.replace(/```\w*\n?/, '').replace(/```$/, '');
      const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      
      const copyIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

      return `
        <div class="code-block-container bg-gray-800 rounded-lg overflow-hidden my-4 border border-gray-600 shadow-sm">
          <div class="code-header px-4 py-3 flex justify-between items-center text-xs bg-gray-850 border-b border-gray-600">
            <span class="text-gray-300 font-medium">${lang}</span>
            <button class="copy-code-btn flex items-center gap-1.5 text-gray-400 hover:text-gray-200 transition-colors bg-transparent border-none cursor-pointer p-1 rounded">
              ${copyIconSVG}
              <span class="copy-text text-xs font-medium">Copy code</span>
            </button>
          </div>
          <pre class="p-4 overflow-x-auto text-sm leading-6 bg-gray-850"><code class="language-${lang} font-mono text-gray-100">${escapedCode.trim()}</code></pre>
        </div>
      `;
    }

    // For non-code parts, apply other markdown rules
    let html = part
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold my-3 text-white">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold my-3 text-white">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-semibold my-3 text-white">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-700 text-red-300 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
      .replace(/\n/g, '<br />');

    return html;
  });

  return processedParts.join('');
};


// --- UI COMPONENTS ---

const Button = ({ children, onClick, className = '', variant = 'primary' }) => {
  let baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  if (variant === 'primary') {
    // Dark mode primary button, styled like a CTA for confirmation
    baseClasses += ' bg-blue-600 text-white hover:bg-blue-500';
  } else if (variant === 'danger') {
    // Dark mode danger button (used for deletion)
    baseClasses += ' bg-red-700 text-white hover:bg-red-600';
  } else if (variant === 'secondary') {
    // Dark mode secondary button (used for cancel/tertiary actions)
    baseClasses += ' bg-gray-700 text-gray-100 hover:bg-gray-600';
  } else if (variant === 'cta') {
    // Specific CTA for sign up/in forms
    baseClasses += ' bg-blue-600 text-white hover:bg-blue-500';
  }

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${className}`}
    >
      {children}
    </button>
  );
};

const InputField = ({ label, type, value, onChange, placeholder, isPassword = false, strength }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full mb-4">
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <div className="relative">
        <input
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors bg-gray-900 text-white placeholder-gray-500`}
        />
        {isPassword && (
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 cursor-pointer"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {strength && (
        <p className={`text-xs mt-1 ${strength.color}`}>{strength.text}</p>
      )}
    </div>
  );
};


const AuthLayout = ({ title, children, footer }) => (
  <div className="min-h-screen flex items-center justify-center bg-black p-4">
    <div className="w-full max-w-sm bg-black p-8 rounded-xl shadow-2xl border border-gray-800">
      <h2 className="text-3xl font-bold text-center text-white mb-6">{title}</h2>
      {children}
      <p className="mt-6 text-center text-sm text-gray-400">{footer}</p>
    </div>
  </div>
);

const SignUpPage = ({ setView }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const strength = password.length > 0 ? getPasswordStrength(password) : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (strength && strength.text !== "Strong" && strength.text !== "Moderate") {
      console.error("Password too weak");
      return;
    }
    // Simulate call
    console.log("Signing up...", { fullName, email });
    setView('dashboard');
  };

  return (
    <AuthLayout title="Create Account" footer={<>Already have an account? <a href="#" onClick={() => setView('signin')} className="font-semibold text-blue-400 hover:text-blue-300">Sign In</a></>}>
      <form onSubmit={handleSubmit} className="space-y-4 bg-black p-6 rounded-lg ">
        <InputField label="Full Name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" />
        <InputField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <InputField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          isPassword
          strength={strength}
        />
        <Button type="submit" className="w-full" variant="cta">Sign Up</Button>
      </form>
    </AuthLayout>
  );
};

const SignInPage = ({ setView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate API call
    console.log("Signing in...", { email });
    setView('dashboard');
  };

  return (
    <AuthLayout title="Welcome Back" footer={<>Don't have an account? <a href="#" onClick={() => setView('signup')} className="font-semibold text-green-400 hover:text-green-300">Sign Up</a></>}>
      <form onSubmit={handleSubmit} className="space-y-4 bg-black p-6 rounded-lg">
        <InputField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <InputField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          isPassword
        />
        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white" variant="cta">Sign In</Button>
      </form>
    </AuthLayout>
  );
};

const ConfirmationModal = ({ confirmation, onConfirm, onCancel }) => {
  if (!confirmation) return null;

  let title = "Confirm Action";
  let message = "Are you sure you want to proceed with this action?";
  let confirmText = "Confirm";
  let danger = false;

  switch (confirmation.type) {
    case 'account':
      title = "Delete Account";
      message = "You are about to permanently delete your account and all associated data. This action cannot be undone.";
      confirmText = "Delete Account";
      danger = true;
      break;
    case 'all_chats':
      title = "Delete All Chats";
      message = "Are you sure you want to delete ALL of your chat history? This cannot be recovered.";
      confirmText = "Delete All";
      danger = true;
      break;
    case 'chat':
      title = "Delete Chat";
      message = `Are you sure you want to delete the chat "${confirmation.title}"?`;
      confirmText = "Delete Chat";
      danger = true;
      break;
    case 'signout':
      title = "Sign Out";
      message = "Are you sure you want to sign out? Your current session will end.";
      confirmText = "Sign Out";
      danger = false;
      break;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 p-6 rounded-xl shadow-2xl max-w-sm w-full transform transition-all border border-gray-700">
        <div className="flex flex-col items-center text-center">
          {(danger || confirmation.type === 'signout') ? <AlertTriangle size={36} className={`mb-4 ${danger ? 'text-red-500' : 'text-yellow-500'}`} /> : null}
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-sm text-gray-300 mb-6">{message}</p>
        </div>

        <div className="flex justify-between space-x-3">
          <Button onClick={onCancel} variant="secondary" className="flex-1">Cancel</Button>
          <Button onClick={onConfirm} variant={danger ? 'danger' : 'primary'} className="flex-1">
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};


const SettingsModal = ({ setView, handleDeleteAccountRequest }) => {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-40 p-4">
      <div className="bg-gray-900 p-6 rounded-xl shadow-2xl max-w-lg w-full border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">User Settings</h3>
          <button onClick={() => setView('dashboard')} className="text-gray-400 hover:text-white cursor-pointer">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-300">Manage your profile information and account preferences here.</p>

          <div className="border-t border-gray-700 pt-4">
            <h4 className="text-lg font-semibold text-red-500 mb-2">Danger Zone</h4>
            <p className="text-sm text-gray-400 mb-4">Permanently delete your account and all associated chat data. This action cannot be undone.</p>
            <Button
              onClick={handleDeleteAccountRequest}
              variant="danger"
              className="font-semibold"
            >
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserProfileMenu = ({ setView, handleDeleteRequest }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left p-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
      >
        <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-3">
                <span className="text-white font-bold">A</span>
            </div>
            <span className="text-sm font-medium text-white">Anonymous User</span>
        </div>
        <MoreHorizontal size={18} className="text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 w-full bg-gray-800 rounded-lg shadow-xl py-2 z-20 border border-gray-700">
          <button 
            onClick={() => { setView('settings'); setIsOpen(false); }}
            className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 flex items-center"
          >
            <User size={16} className="mr-2"/> Settings
          </button>
          <button 
            onClick={() => { handleDeleteRequest('signout'); setIsOpen(false); }}
            className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 flex items-center"
          >
            <LogOut size={16} className="mr-2"/> Sign Out
          </button>
        </div>
      )}
    </div>
  );
};


const PastChatsList = ({ chats, currentChatId, setCurrentChatId, createNewChat, updateChat, handleDeleteRequest, setView }) => {
  const [editingId, setEditingId] = useState(null);
  const [newTitle, setNewTitle] = useState('');

  const startRename = (chat) => {
    setEditingId(chat.id);
    setNewTitle(chat.title);
  };

  const handleRename = (id) => {
    if (newTitle.trim()) {
      updateChat(id, newTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-black text-gray-200">
      <div className="p-4 flex-shrink-0 flex items-center gap-3 border-b border-gray-800">
        <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
            <User size={22} className="text-white"/>
        </div>
        <h1 className="text-lg font-semibold text-white">Secure AI</h1>
      </div>
      <div className="p-2 flex-shrink-0">
        <button onClick={createNewChat} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
          <span className="text-sm font-medium">New Chat</span>
          <Plus size={18} />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto px-2 space-y-1">
        {chats.map(chat => (
          <div
            key={chat.id}
            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors duration-150 group
              ${currentChatId === chat.id ? 'bg-gray-800 font-semibold' : 'hover:bg-gray-800'}`
            }
            onClick={() => setCurrentChatId(chat.id)}
          >
            {editingId === chat.id ? (
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onBlur={() => handleRename(chat.id)}
                onKeyDown={(e) => e.key === 'Enter' && handleRename(chat.id)}
                autoFocus
                className="bg-gray-700 border border-gray-600 rounded-md p-1 w-full text-sm text-white"
              />
            ) : (
              <span className="truncate text-sm">{chat.title}</span>
            )}

            <div className="flex space-x-1 ml-2 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); startRename(chat); }}
                className="p-1 hover:text-white cursor-pointer"
                aria-label="Rename Chat"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteRequest('chat', chat.id, chat.title); }}
                className="p-1 hover:text-red-400 cursor-pointer"
                aria-label="Delete Chat"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-2 border-t border-gray-800 flex-shrink-0">
          <UserProfileMenu setView={setView} handleDeleteRequest={handleDeleteRequest} />
      </div>

    </div>
  );
};


const ChatInterface = ({ currentChat, handleUserSubmit }) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null); // Ref for event delegation
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [inputText]);

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

    await handleUserSubmit(userMessage);

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
                {msg.role === 'user' && (
                  <button
                    className="copy-message-btn flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-400 hover:text-white cursor-pointer"
                    onClick={() => handleCopyMessage(msg.content)}
                    aria-label="Copy message"
                    style={{ marginTop: '4px' }}
                  >
                    <Copy size={16} />
                  </button>
                )}
                <div
                  className={`message-container max-w-2xl text-white ${
                    msg.role === 'user'
                      ? 'bg-gray-800 p-3 rounded-xl group'
                      : 'group relative'
                  }`}
                  data-message-text={msg.content}
                >
                  {msg.role === 'ai' && (
                    <button
                      className="copy-message-btn absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded cursor-pointer"
                      onClick={() => handleCopyMessage(msg.content)}
                      aria-label="Copy message"
                    >
                      <Copy size={14} />
                    </button>
                  )}
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
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center max-w-4xl mx-auto bg-gray-900 border border-gray-700 rounded-2xl shadow-lg"
        >
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


const Dashboard = ({ setView, chats, setChats, currentChatId, setCurrentChatId, handleDeleteRequest, handleUserSubmit }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const currentChat = chats.find(c => c.id === currentChatId);

  const createNewChat = () => {
    setCurrentChatId(null);
  };

  const updateChat = (id, newTitle) => {
    setChats(prevChats => prevChats.map(chat =>
      chat.id === id ? { ...chat, title: newTitle } : chat
    ));
  };

  return (
    <div className="flex h-screen bg-black">
      {/* Sidebar */}
      <div className={`flex-shrink-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-0'} overflow-hidden`}>
          <PastChatsList
              chats={chats}
              currentChatId={currentChatId}
              setCurrentChatId={setCurrentChatId}
              createNewChat={createNewChat}
              updateChat={updateChat}
              handleDeleteRequest={handleDeleteRequest}
              setView={setView}
          />
      </div>

      {/* Main Content */}
      <div className="flex-grow flex flex-col min-w-0">
         {/* Top bar inside main content */}
         <div className="flex items-center p-2 border-b border-gray-800 bg-black flex-shrink-0">
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer" aria-label="Toggle Sidebar">
                 <Menu size={20} />
             </button>
             <h2 className="text-sm font-medium text-white ml-2">{currentChat?.title || 'New Chat'}</h2>
             {currentChat && (
                <div className="ml-auto relative flex items-center group">
                    <Lock size={16} className={`${currentChat.encrypted ? 'text-blue-400' : 'text-yellow-400'}`} />
                    <div className="absolute top-full mt-3 right-0 w-max max-w-xs p-2 text-xs text-white bg-gray-950 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 border border-gray-700">
                        {currentChat.encrypted ? 'Secure Session: AES-256' : 'Standard Session'}
                    </div>
                </div>
             )}
         </div>
         <div className="flex-grow min-h-0">
             <ChatInterface currentChat={currentChat} handleUserSubmit={handleUserSubmit} />
         </div>
      </div>
    </div>
  );
};


// --- MAIN APP COMPONENT ---

const App = () => {
  const [view, setView] = useState('signin'); // 'signin', 'signup', 'dashboard', 'settings'
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [confirmation, setConfirmation] = useState(null); // { type: 'chat', id: 'uuid', title: '...' } | { type: 'all_chats' } | { type: 'account' } | { type: 'signout' }

  const handleUserSubmit = async (userMessage) => {
    let targetChatId = currentChatId;
    let historyForApi;
    let currentChats = chats; // Get current state from a local variable

    if (!targetChatId) { // This is the first message in a new chat session
        const newId = uuidv4();
        const title = userMessage.split(' ').slice(0, 4).join(' ') || "New Chat";
        const newChat = {
            id: newId,
            title,
            encrypted: true,
            messages: [{ role: 'user', content: userMessage }],
        };
        const updatedChats = [newChat, ...currentChats];
        setChats(updatedChats);
        setCurrentChatId(newId);
        
        targetChatId = newId;
        historyForApi = newChat.messages;
    } else { // This is a message in an existing chat
        const updatedChats = currentChats.map(chat =>
            chat.id === targetChatId
                ? { ...chat, messages: [...chat.messages, { role: 'user', content: userMessage }] }
                : chat
        );
        setChats(updatedChats);
        historyForApi = updatedChats.find(c => c.id === targetChatId).messages;
    }

    // Now, call the API
    const aiResponse = await generateAiResponse(userMessage, historyForApi);

    // Add the AI response to the correct chat
    setChats(prevChats => prevChats.map(chat =>
        chat.id === targetChatId
            ? { ...chat, messages: [...chat.messages, { role: 'ai', content: aiResponse }] }
            : chat
    ));
  };


  const deleteChat = (idToDelete) => {
    const updatedChats = chats.filter(chat => chat.id !== idToDelete);
    setChats(updatedChats);

    if (currentChatId === idToDelete) {
      setCurrentChatId(null); // Go back to the "new chat" screen
    }
  };

  const deleteAllChats = () => {
    setChats([]);
    setCurrentChatId(null);
  };

  // 1. Request to delete/action (opens the confirmation modal)
  const handleDeleteRequest = (type, id = null, title = null) => {
    // Close settings modal if open, ensures we see the confirmation modal
    if (view === 'settings') setView('dashboard');

    if (type === 'chat' && id) {
      setConfirmation({ type: 'chat', id, title });
    } else if (type === 'all_chats') {
      setConfirmation({ type: 'all_chats' });
    } else if (type === 'account') {
      setConfirmation({ type: 'account' });
    } else if (type === 'signout') {
      setConfirmation({ type: 'signout' });
    }
  };

  // 2. Execute deletion/action after confirmation
  const executeAction = () => {
    if (!confirmation) return;

    switch (confirmation.type) {
      case 'account':
        setChats([]);
        setCurrentChatId(null);
        setView('signin');
        break;
      case 'chat':
        deleteChat(confirmation.id);
        break;
      case 'all_chats':
        deleteAllChats();
        break;
      case 'signout':
        // Reset state and go to sign in page
        // Keeping chat state for simulation, but a real app would clear this
        setView('signin');
        break;
    }
    setConfirmation(null); // Close modal
  };

  const renderContent = () => {
    switch (view) {
      case 'signup':
        return <SignUpPage setView={setView} />;
      case 'signin':
        return <SignInPage setView={setView} />;
      case 'dashboard':
        return <Dashboard
          setView={setView}
          chats={chats}
          setChats={setChats}
          currentChatId={currentChatId}
          setCurrentChatId={setCurrentChatId}
          handleDeleteRequest={handleDeleteRequest}
          handleUserSubmit={handleUserSubmit}
        />;
      default:
        return <SignInPage setView={setView} />;
    }
  };

  return (
    <>
      <style>{`
        *::-webkit-scrollbar {
          display: none;
        }
        * {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        html, body {
          margin: 0;
          padding: 0;
          height: 100vh;
          overflow: hidden;
        }
      `}</style>
      <div className="font-sans min-h-screen bg-black">
        {renderContent()}
        {view === 'settings' && (
          <SettingsModal setView={setView} handleDeleteAccountRequest={() => handleDeleteRequest('account')} />
        )}
        <ConfirmationModal
          confirmation={confirmation}
          onConfirm={executeAction}
          onCancel={() => setConfirmation(null)}
        />
      </div>
    </>
  );
};

export default App;
