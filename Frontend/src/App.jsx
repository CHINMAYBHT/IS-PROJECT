import { useState, useEffect, useRef } from 'react';
import { FiUser, FiLogOut, FiPlus, FiTrash2, FiEdit3, FiEye, FiEyeOff, FiLock, FiX, FiAlertTriangle, FiMenu, FiArrowUp, FiMoreHorizontal, FiSettings } from 'react-icons/fi';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { IoWarningOutline } from 'react-icons/io5';
import { uuidv4 } from './utils/uuid';
import { getPasswordStrength } from './utils/password';
import { generateAiResponse } from './utils/api';
import { parseMarkdown } from './utils/markdown';


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
            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900/95 border border-zinc-700/50 rounded-xl shadow-2xl max-w-sm w-full backdrop-blur-sm p-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            {danger ? (
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                <RiDeleteBin6Line className="w-4 h-4 text-red-400" />
              </div>
            ) : confirmation.type === 'signout' ? (
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <FiLogOut className="w-4 h-4 text-blue-400" />
              </div>
            ) : null}
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          <p className="text-sm text-zinc-300 mb-6 leading-relaxed">{message}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              danger 
                ? 'text-white bg-red-600 hover:bg-red-700' 
                : 'text-white bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};


const SettingsModal = ({ setView, handleDeleteAccountRequest }) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-40 p-4">
      <div className="bg-zinc-900/95 border border-zinc-700/50 rounded-xl shadow-2xl max-w-md w-full backdrop-blur-sm">
        <div className="flex items-center justify-between p-6 border-b border-zinc-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
              <FiSettings className="w-4 h-4 text-zinc-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Settings</h3>
          </div>
          <button 
            onClick={() => setView('dashboard')} 
            className="w-8 h-8 rounded-lg hover:bg-zinc-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <FiX className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <p className="text-sm text-zinc-300">Manage your account and preferences</p>
          </div>
          
          <div className="border border-red-500/20 bg-red-500/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <RiDeleteBin6Line className="w-4 h-4 text-red-400" />
              <h4 className="text-sm font-medium text-red-400">Danger Zone</h4>
            </div>
            <p className="text-xs text-zinc-400 mb-4">This will permanently delete your account and all chat data. This cannot be undone.</p>
            <button
              onClick={handleDeleteAccountRequest}
              className="px-3 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
            >
              Delete Account
            </button>
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
        <FiMoreHorizontal size={18} className="text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 w-full bg-zinc-900/95 border border-zinc-700/50 rounded-lg shadow-xl backdrop-blur-sm z-20">
          <div className="p-1">
            <button 
              onClick={() => { setView('settings'); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            >
              <FiSettings className="w-4 h-4" />
              Settings
            </button>
            <button 
              onClick={() => { handleDeleteRequest('signout'); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            >
              <FiLogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
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
            <FiUser size={22} className="text-white"/>
        </div>
        <h1 className="text-lg font-semibold text-white">Secure AI</h1>
      </div>
      <div className="p-2 flex-shrink-0">
        <button onClick={createNewChat} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
          <span className="text-sm font-medium">New Chat</span>
          <FiPlus size={18} />
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
                <FiEdit3 size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteRequest('chat', chat.id, chat.title); }}
                className="p-1 hover:text-red-400 cursor-pointer"
                aria-label="Delete Chat"
              >
                <FiTrash2 size={14} />
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
                <FiUser size={32} className="text-white"/>
            </div>
            <h2 className="text-2xl font-semibold text-gray-300">Ready when you are.</h2>
          </div>
        ) : (
          <>
            {currentChat.messages.map((msg, index) => (
              <div key={index} className={`flex items-start gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`text-white ${
                    msg.role === 'user'
                      ? 'max-w-2xl bg-gray-800 p-3 rounded-xl'
                      : 'max-w-4xl'
                  }`}
                >
                  {msg.role === 'user' ? (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                      <div
                          className="text-md leading-relaxed whitespace-pre-wrap"
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
            className="flex-grow w-full pl-4 pr-16 py-4 bg-transparent focus:outline-none text-sm text-white resize-none overflow-y-auto scrollbar-hide"
            rows="1"
            disabled={isTyping}
            style={{minHeight: '60px', maxHeight: '200px', cursor: isTyping ? 'not-allowed' : 'text'}}
          />
          <button
            type="submit"
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-colors cursor-pointer ${
                (inputText.trim() && !isTyping)
                ? 'bg-white text-black'
                : 'bg-gray-700 text-white'
            } disabled:bg-gray-800 disabled:cursor-not-allowed`}
            disabled={inputText.trim() === '' || isTyping}
          >
            <FiArrowUp size={18} />
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
                 <FiMenu size={20} />
             </button>
             <h2 className="text-sm font-medium text-white ml-2">{currentChat?.title || 'New Chat'}</h2>
             {currentChat && (
                <div className="ml-auto relative flex items-center group">
                    <FiLock size={16} className={`${currentChat.encrypted ? 'text-blue-400' : 'text-yellow-400'}`} />
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
  const [view, setView] = useState(() => localStorage.getItem('view') || 'signin');
  const [chats, setChats] = useState(() => JSON.parse(localStorage.getItem('chats') || '[]'));
  const [currentChatId, setCurrentChatId] = useState(() => localStorage.getItem('currentChatId') || null);
  const [confirmation, setConfirmation] = useState(null);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('view', view);
  }, [view]);

  useEffect(() => {
    localStorage.setItem('chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    if (currentChatId) {
      localStorage.setItem('currentChatId', currentChatId);
    } else {
      localStorage.removeItem('currentChatId');
    }
  }, [currentChatId]);

  const handleUserSubmit = async (userMessage) => {
    let targetChatId = currentChatId;
    let currentChats = chats; // Get current state from a local variable
    
    // Find the current chat object
    const currentChat = currentChats.find(chat => chat.id === targetChatId);
    
    if (!currentChat) {
      // Create a new chat if no current chat exists
      const newId = uuidv4();
      const title = userMessage.split(' ').slice(0, 4).join(' ') || "New Chat";
      const newChat = {
        id: newId,
        title,
        messages: [{ role: 'user', content: userMessage, timestamp: new Date().toISOString() }],
      };
      
      // Add the new chat to the list
      const updatedChats = [newChat, ...currentChats];
      setChats(updatedChats);
      setCurrentChatId(newId);
      
      // Get AI response
      const aiResponse = await generateAiResponse(userMessage, []);
      
      // Update the chat with AI response
      const finalChats = updatedChats.map(chat =>
        chat.id === newId
          ? { 
              ...chat, 
              messages: [
                ...chat.messages,
                { role: 'ai', content: aiResponse, timestamp: new Date().toISOString() }
              ]
            }
          : chat
      );
      setChats(finalChats);
    } else {
      // Update existing chat with user message
      const updatedChats = currentChats.map(chat =>
        chat.id === targetChatId
          ? { 
              ...chat, 
              messages: [
                ...chat.messages,
                { role: 'user', content: userMessage, timestamp: new Date().toISOString() }
              ]
            }
          : chat
      );
      setChats(updatedChats);
      
      // Get the updated messages for the API call
      const updatedMessages = updatedChats.find(chat => chat.id === targetChatId).messages;
      
      // Get AI response
      const aiResponse = await generateAiResponse(userMessage, updatedMessages);
      
      // Update chat with AI response
      const finalChats = updatedChats.map(chat =>
        chat.id === targetChatId
          ? { 
              ...chat, 
              messages: [
                ...chat.messages,
                { role: 'ai', content: aiResponse, timestamp: new Date().toISOString() }
              ]
            }
          : chat
      );
      setChats(finalChats);
    }
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
        return (
          <Dashboard
            setView={setView}
            chats={chats}
            setChats={setChats}
            currentChatId={currentChatId}
            setCurrentChatId={setCurrentChatId}
            handleDeleteRequest={handleDeleteRequest}
            handleUserSubmit={handleUserSubmit}
          />
        );
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
