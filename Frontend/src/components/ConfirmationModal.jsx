import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

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

export default ConfirmationModal;
