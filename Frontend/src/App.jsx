import { useState, useEffect, useRef } from 'react';
import { FiUser, FiLogOut, FiPlus, FiTrash2, FiEdit3, FiEye, FiEyeOff, FiLock, FiX, FiAlertTriangle, FiMenu, FiArrowUp, FiMoreHorizontal, FiSettings } from 'react-icons/fi';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { IoWarningOutline } from 'react-icons/io5';
import { uuidv4 } from './utils/uuid';
import { getPasswordStrength } from './utils/password';
import { apiClient, encryptionClient, generateAiResponse } from './utils/api';
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

const SignUpPage = ({ setView, onAuthSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const strength = password.length > 0 ? getPasswordStrength(password) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (strength && strength.text !== "Strong" && strength.text !== "Moderate") {
      setError("Password too weak");
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiClient.signUp({
        fullName,
        email,
        password
      });

      onAuthSuccess(result.token, result.user);
      setView('dashboard');
    } catch (error) {
      // Error message is now user-friendly from the API client
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Create Account" footer={<>Already have an account? <a href="#" onClick={() => setView('signin')} className="font-semibold text-blue-400 cursor-pointer hover:text-blue-300">Sign In</a></>}>
      <form onSubmit={handleSubmit} className="space-y-4 bg-black p-6 rounded-lg ">
        {error && <div className="text-red-400 text-sm mb-4">{error}</div>}
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
        <Button type="submit" className="w-full cursor-pointer" variant="cta" disabled={isLoading}>
          {isLoading ? 'Signing Up...' : 'Sign Up'}
        </Button>
      </form>
    </AuthLayout>
  );
};

const SignInPage = ({ setView, onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await apiClient.signIn({
        email,
        password
      });

      onAuthSuccess(result.token, result.user);
      setView('dashboard');
    } catch (error) {
      // Error message is now user-friendly from the API client
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back" footer={<>Don't have an account? <a href="#" onClick={() => setView('signup')} className="font-semibold text-green-400 hover:text-green-300">Sign Up</a></>}>
      <form onSubmit={handleSubmit} className="space-y-4 bg-black p-6 rounded-lg">
        {error && <div className="text-red-400 text-sm mb-4">{error}</div>}
        <InputField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <InputField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          isPassword
        />
        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white cursor-pointer" variant="cta" disabled={isLoading}>
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>
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

  const isNewChat = !currentChat || !currentChat.messages || currentChat.messages.length === 0;

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
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content || ''}</p>
                  ) : (
                      (msg.content === null || msg.content === undefined) ? (
                          // Thinking placeholder
                          <p className="text-sm text-gray-400 italic">thinking...</p>
                      ) : (
                          <div
                              className="text-md leading-relaxed whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{ __html: parseMarkdown(String(msg.content)) }}
                          />
                      )
                  )}
                </div>
              </div>
            ))}
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


const Dashboard = ({ setView, chats, setChats, currentChatId, setCurrentChatId, handleDeleteRequest, handleUserSubmit, updateChat }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const currentChat = chats.find(c => c.id === currentChatId);

  const createNewChat = () => {
    setCurrentChatId(null);
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
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [encryptionSessions, setEncryptionSessions] = useState({}); // sessionId -> encryption key

  // Check for existing token and load user data
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        apiClient.setToken(token);
        setUser(parsedUser);
        setView('dashboard');
        loadChatsFromBackend();
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Authentication success handler
  const handleAuthSuccess = (token, userData) => {
    apiClient.setToken(token);
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    loadChatsFromBackend();
  };

  // Load chats from backend
  const loadChatsFromBackend = async () => {
    try {
      setIsLoadingChats(true);
      const fetchedChats = await apiClient.getChats();
      setChats(fetchedChats);
    } catch (error) {
      console.error('Error loading chats:', error);
      // Handle authentication errors
      if (error.message.includes('Access token')) {
        handleSignOut();
      }
    } finally {
      setIsLoadingChats(false);
    }
  };

  // Load messages for a specific chat
  const loadMessagesForChat = async (chatId) => {
    try {
      const fetchedMessages = await apiClient.getEncryptedMessages(chatId);
      // Decrypt messages if needed
      const chat = chats.find(c => c.id === chatId);
      let processedMessages = fetchedMessages;

      if (chat && chat.encrypted) {
        processedMessages = await Promise.all(
          fetchedMessages.map(async (msg) => {
            if (msg.encryptedMessage && msg.iv && msg.sessionId) {
              try {
                // Decrypt the message
                const decrypted = await encryptionClient.decrypt(msg.encryptedMessage, msg.iv, msg.sessionId);
                return {
                  ...msg,
                  content: decrypted.decrypted_data
                };
              } catch (decryptError) {
                console.error(`Error decrypting message ${msg.id}:`, decryptError);
                // Fall back to showing encrypted indicator
                return {
                  ...msg,
                  content: '[⚠️ Encrypted message - unable to decrypt]'
                };
              }
            } else {
              // Message is not fully encrypted or corrupted, show placeholder
              return {
                ...msg,
                content: '[⚠️ Message data incomplete]'
              };
            }
          })
        );
      }

      // Update the chat with loaded messages
      setChats(prevChats => prevChats.map(chat =>
        chat.id === chatId ? { ...chat, messages: processedMessages } : chat
      ));

    } catch (error) {
      console.error(`Error loading messages for chat ${chatId}:`, error);
    }
  };

  // Handle sign out
  const handleSignOut = () => {
    apiClient.setToken(null);
    setUser(null);
    setChats([]);
    setCurrentChatId(null);
    setView('signin');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Handle account deletion
  const handleAccountDeletion = async () => {
    try {
      console.log('🗑️ [DELETE ACCOUNT] Initiating account deletion');

      // Make sure we have a valid token before proceeding
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ [DELETE ACCOUNT] No authentication token found');
        alert('Authentication required. Please sign in again.');
        handleSignOut();
        return;
      }

      // Ensure token is set in API client
      apiClient.setToken(token);

      // Attempt account deletion
      await apiClient.deleteAccount();
      console.log('✅ [DELETE ACCOUNT] Account deleted successfully from database');

      // Clear client-side data and redirect (but don't call handleSignOut which clears token too early)
      apiClient.setToken(null);
      setUser(null);
      setChats([]);
      setCurrentChatId(null);
      setView('signin');
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      alert('Account deleted successfully. You have been signed out.');
    } catch (error) {
      console.error('❌ [DELETE ACCOUNT] Failed to delete account:', error);

      // Provide more specific error messages based on the error type
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        alert('Authentication failed. Please sign in again before deleting your account.');
        handleSignOut();
      } else if (error.message.includes('404') || error.message.includes('not found')) {
        alert('Account not found. It may have already been deleted.');
        handleSignOut();
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        alert('Network error. Please check your connection and try again.');
      } else {
        alert('Failed to delete account. Please try again or contact support.');
      }
    }
  };

  // Save view to localStorage
  useEffect(() => {
    localStorage.setItem('view', view);
  }, [view]);

  // Load messages when a chat is selected
  useEffect(() => {
    if (currentChatId && chats.length > 0) {
      const chat = chats.find(c => c.id === currentChatId);
      if (chat && !chat.messages) {
        loadMessagesForChat(currentChatId);
      }
    }
  }, [currentChatId, chats]);

  const handleUserSubmit = async (userMessage) => {
    let targetChatId = currentChatId;
    let currentChats = chats;

    // Find the current chat object
    const currentChat = currentChats.find(chat => chat.id === targetChatId);

    if (!currentChat) {
      console.log('🎙️ [NEW CHAT] Creating new encrypted chat on backend');

      // GENERATE ENCRYPTION SESSION FIRST
      const sessionId = uuidv4(); // Generate session ID for new chat
      const keyResponse = await encryptionClient.generateKey(sessionId, user.id);
      const encryptionKey = keyResponse.key;

      // Store key in local state for immediate use
      setEncryptionSessions(prev => ({
        ...prev,
        [sessionId]: encryptionKey
      }));

      // Create new chat using backend API (always encrypted by default)
      const title = userMessage.split(' ').slice(0, 4).join(' ') || "New Chat";
      const newChat = await apiClient.createChat({
        title,
        encrypted: true // All chats are encrypted by default for security
      });

      // Update chat ID to match our session ID for consistency
      const actualChatId = newChat.id;

      // Add to local state
      const updatedChats = [newChat, ...currentChats];
      setChats(updatedChats);
      setCurrentChatId(actualChatId);

      console.log(`🎙️ [NEW CHAT] Created encrypted chat: ${actualChatId}, session: ${sessionId}`);

      // ENCRYPT USER MESSAGE
      console.log('🔐 [ENCRYPT] Encrypting user message for new chat...');
      const encryptedUserMessage = await encryptionClient.encrypt(userMessage, sessionId);

      // IMMEDIATELY show user message in UI (with encryption indicator)
      const newUserMessage = {
        role: 'user',
        content: userMessage, // Show plain text in UI
        timestamp: new Date().toISOString()
      };

      const thinkingMessage = {
        role: 'ai',
        content: null, // Will be replaced with actual response
        timestamp: new Date().toISOString()
      };

      setChats(prevChats => prevChats.map(chat =>
        chat.id === actualChatId ? {
          ...chat,
          messages: [newUserMessage, thinkingMessage]
        } : chat
      ));

      // Send encrypted message to AI and get encrypted response
      const aiResponseData = await apiClient.generateAiResponse(
        {
          encrypted_data: encryptedUserMessage.encrypted_data,
          iv: encryptedUserMessage.iv
        },
        [], // No context for new chat
        "openai/gpt-3.5-turbo",
        true, // encrypted flag
        sessionId, // session ID for encryption
        user.id // user ID for database lookup
      );

      // Decrypt AI response for UI display (aiResponseData.response contains encrypted data)
      const aiResponse = await encryptionClient.decrypt(
        aiResponseData.response,  // encryptedData
        aiResponseData.iv,        // iv
        sessionId                 // sessionId
      );
      console.log(`🤖 [AI RESPONSE] Decrypted and got response (${aiResponse.decrypted_data.length} chars)`);

      // Store ENCRYPTED messages in database (backend will only store encrypted data)
      await apiClient.storeEncryptedMessage(
        actualChatId,
        userMessage,
        encryptedUserMessage.encrypted_data,
        encryptedUserMessage.iv,
        sessionId,
        'user'
      );
      await apiClient.storeEncryptedMessage(
        actualChatId,
        aiResponse.decrypted_data,
        aiResponseData.response, // Encrypted AI response from backend
        aiResponseData.iv,
        sessionId,
        'ai'
      );

      // Replace thinking message with actual DECRYPTED response
      const actualAIMessage = {
        role: 'ai',
        content: aiResponse.decrypted_data,
        timestamp: new Date().toISOString()
      };

      setChats(prevChats => prevChats.map(chat =>
        chat.id === actualChatId ? {
          ...chat,
          messages: [newUserMessage, actualAIMessage]
        } : chat
      ));

    } else if (currentChat.encrypted) {
      console.log('🔐 [ENCRYPTED CHAT] Processing encrypted message');

      // Handle encrypted chat
      const sessionId = currentChat.id; // Use chat ID as session ID

      let encryptionKey = encryptionSessions[sessionId];
      if (!encryptionKey) {
        console.log('🔑 [ENCRYPTION] Generating new encryption key for session:', sessionId);
        // Generate encryption key if not exists - now includes user_id for database storage
        const keyResponse = await encryptionClient.generateKey(sessionId, user.id);
        encryptionKey = keyResponse.key;

        setEncryptionSessions(prev => ({
          ...prev,
          [sessionId]: encryptionKey
        }));
        console.log('✅ [ENCRYPTION] Key generated and stored');
      }

      // IMMEDIATELY show encrypted user message in UI
      const encryptedUserMessage = {
        role: 'user',
        content:userMessage,
        timestamp: new Date().toISOString(),
        encrypted: true
      };

      setChats(prevChats => prevChats.map(chat =>
        chat.id === currentChat.id ? {
          ...chat,
          messages: [...(chat.messages || []), encryptedUserMessage, {
            role: 'ai',
            content: null, // Thinking placeholder
            timestamp: new Date().toISOString(),
            encrypted: true
          }]
        } : chat
      ));

      // Encrypt user message
      console.log('🔐 [ENCRYPT] Encrypting user message...');
      const encryptedMessage = await encryptionClient.encrypt(userMessage, sessionId);
      console.log('✅ [ENCRYPT] Message encrypted successfully');

      // Send encrypted message to backend for processing
      // Exclude temporary UI messages and ensure content is not null/undefined
      const contextMessages = currentChat.messages
        .filter(msg =>
          msg.content &&
          !msg.content.startsWith('🔐 ') &&
          typeof msg.content === 'string'
        )
        .map(msg => msg.content);

      const aiResponseData = await apiClient.generateAiResponse(
        {
          encrypted_data: encryptedMessage.encrypted_data,
          iv: encryptedMessage.iv
        },
        contextMessages,
        "openai/gpt-3.5-turbo",
        true, // encrypted flag
        sessionId, // session ID for encryption
        user.id // user ID for database lookup
      );

      // Backend will decrypt, process with AI, encrypt response, and store all in database
      console.log('✅ [ENCRYPTED CHAT] Response received, updating UI');

      let aiContent;
      if (typeof aiResponseData === 'string') {
        // API error returned fallback message
        aiContent = aiResponseData;
      } else {
        // Normal case - decrypt the encrypted AI response
        const decryptResult = await encryptionClient.decrypt(
          aiResponseData.response,  // encryptedData
          aiResponseData.iv,        // iv
          sessionId                 // sessionId
        );
        aiContent = decryptResult.decrypted_data;
      }

      const finalMessages = [
        ...currentChat.messages,
        encryptedUserMessage,
        {
          role: 'ai',
          content: aiContent,
          timestamp: new Date().toISOString(),
          encrypted: true
        }
      ];

      setChats(prevChats => prevChats.map(chat =>
        chat.id === currentChat.id ? {
          ...chat,
          messages: finalMessages
        } : chat
      ));

    } else {
      console.log('📝 [UNENCRYPTED CHAT] Processing unencrypted message');

      // IMMEDIATELY show user message in UI with thinking indicator
      const newUserMessage = {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString()
      };

      const thinkingMessage = {
        role: 'ai',
        content: null, // Will be replaced with actual response
        timestamp: new Date().toISOString()
      };

      setChats(prevChats => prevChats.map(chat =>
        chat.id === currentChat.id ? {
          ...chat,
          messages: [...(chat.messages || []), newUserMessage, thinkingMessage]
        } : chat
      ));

      // Handle unencrypted chat - normal flow
      const existingMessages = currentChat.messages || [];
      const lastMessages = [...existingMessages, newUserMessage]; // Include the new message
      const contextMessages = lastMessages.slice(-20); // Keep last 20 messages

      // Send to AI
      const aiResponse = await apiClient.generateAiResponse(userMessage, contextMessages.slice(0, -1)); // Don't send thinking
      console.log(`🤖 [AI RESPONSE] Got response (${aiResponse.length} chars)`);

      // Store both messages in database
      await apiClient.storeEncryptedMessage(currentChat.id, userMessage, userMessage, '', 'plaintext', 'user');
      await apiClient.storeEncryptedMessage(currentChat.id, aiResponse, aiResponse, '', 'plaintext', 'ai');

      // Replace thinking message with actual AI response
      const actualAIMessage = {
        role: 'ai',
        content: aiResponse,
        timestamp: new Date().toISOString()
      };

      setChats(prevChats => prevChats.map(chat =>
        chat.id === currentChat.id ? {
          ...chat,
          messages: [
            ...chat.messages.slice(0, -1), // Remove thinking message
            actualAIMessage // Add actual response
          ]
        } : chat
      ));

      console.log('✅ [UNENCRYPTED CHAT] Messages stored and UI updated');
    }
  };


  const deleteChat = async (idToDelete) => {
    console.log(`🗑️ [DELETE CHAT] Deleting chat: ${idToDelete}`);
    try {
      await apiClient.deleteChat(idToDelete);
      console.log(`✅ [DELETE CHAT] Chat deleted successfully: ${idToDelete}`);

      const updatedChats = chats.filter(chat => chat.id !== idToDelete);
      setChats(updatedChats);

      if (currentChatId === idToDelete) {
        setCurrentChatId(null); // Go back to the "new chat" screen
      }
    } catch (error) {
      console.error(`❌ [DELETE CHAT] Failed to delete chat: ${error.message}`);
      // Still remove from local state even if backend fails
      const updatedChats = chats.filter(chat => chat.id !== idToDelete);
      setChats(updatedChats);
      if (currentChatId === idToDelete) {
        setCurrentChatId(null);
      }
    }
  };

  const deleteAllChats = async () => {
    console.log(`🗑️ [DELETE ALL CHATS] Deleting all user chats`);
    try {
      await apiClient.deleteAllChats();
      console.log(`✅ [DELETE ALL CHATS] All chats deleted successfully`);

      setChats([]);
      setCurrentChatId(null);
    } catch (error) {
      console.error(`❌ [DELETE ALL CHATS] Failed to delete chats: ${error.message}`);
      // Still clear local state
      setChats([]);
      setCurrentChatId(null);
    }
  };

  const updateChat = async (id, newTitle) => {
    console.log(`✏️ [UPDATE CHAT] Updating chat ${id} to title: "${newTitle}"`);
    try {
      await apiClient.updateChat(id, { title: newTitle });
      console.log(`✅ [UPDATE CHAT] Chat title updated successfully: ${id}`);

      setChats(prevChats => prevChats.map(chat =>
        chat.id === id ? { ...chat, title: newTitle } : chat
      ));
    } catch (error) {
      console.error(`❌ [UPDATE CHAT] Failed to update chat: ${error.message}`);
      // Don't update local state if backend fails
    }
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
        handleAccountDeletion();
        break;
      case 'chat':
        deleteChat(confirmation.id);
        break;
      case 'all_chats':
        deleteAllChats();
        break;
      case 'signout':
        handleSignOut();
        break;
    }
    setConfirmation(null); // Close modal
  };

  const renderContent = () => {
    switch (view) {
      case 'signup':
        return <SignUpPage setView={setView} onAuthSuccess={handleAuthSuccess} />;
      case 'signin':
        return <SignInPage setView={setView} onAuthSuccess={handleAuthSuccess} />;
      case 'dashboard':
        return (
          <Dashboard
            user={user}
            setView={setView}
            chats={chats}
            setChats={setChats}
            currentChatId={currentChatId}
            setCurrentChatId={setCurrentChatId}
            handleDeleteRequest={handleDeleteRequest}
            handleUserSubmit={handleUserSubmit}
            updateChat={updateChat}
            isLoadingChats={isLoadingChats}
            loadChatsFromBackend={loadChatsFromBackend}
          />
        );
      default:
        return <SignInPage setView={setView} onAuthSuccess={handleAuthSuccess} />;
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
