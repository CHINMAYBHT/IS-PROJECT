import React from 'react';
import { X } from 'lucide-react';
import Button from './Button';

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

export default SettingsModal;
