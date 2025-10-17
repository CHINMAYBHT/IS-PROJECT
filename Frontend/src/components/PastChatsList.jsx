import React, { useState } from 'react';
import { User, Plus, Pencil, Trash2 } from 'lucide-react';
import UserProfileMenu from './UserProfileMenu';

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
              ${currentChatId === chat.id ? 'bg-gray-800 font-semibold' : 'hover:bg-gray-800'}`}
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

export default PastChatsList;
