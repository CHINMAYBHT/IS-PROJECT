import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const InputField = ({ label, type, value, onChange, placeholder, isPassword = false, strength, error, onBlur, required }) => {
  const [showPassword, setShowPassword] = useState(false);

  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const inputClasses = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 transition-colors bg-gray-900 text-white placeholder-gray-500 ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-blue-500'}`;

  return (
    <div className="w-full mb-4">
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}{required ? <span className="text-red-500"> *</span> : null}</label>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={inputClasses}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${label}-error` : undefined}
          required={required}
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
      {error && (
        <p id={`${label}-error`} className="text-xs mt-1 text-red-400">{error}</p>
      )}
    </div>
  );
};

export default InputField;
