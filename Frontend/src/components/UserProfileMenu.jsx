import React, { useState, useEffect, useRef } from 'react';
import { User, LogOut, MoreHorizontal } from 'lucide-react';

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

export default UserProfileMenu;
