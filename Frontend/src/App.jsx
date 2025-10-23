import { useState, useEffect, useRef } from 'react';
import { FiUser, FiLogOut, FiPlus, FiTrash2, FiEdit3, FiEye, FiEyeOff, FiLock, FiX, FiAlertTriangle, FiMenu, FiArrowUp, FiMoreHorizontal, FiSettings, FiImage } from 'react-icons/fi';
import { RiDeleteBin6Line } from 'react-icons/ri';
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
      encryptionClient.setToken(result.token);
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

const ForgotPasswordPage = ({ setView }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter OTP, 3: Enter new password, 4: Success

  // Step 1: Send OTP to email
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Email is required');
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiClient.forgotPassword(email);
      if (result.success) {
        setMessage('Verification code sent successfully! Please check your inbox.');
        setStep(2); // Move to OTP verification step
      } else {
        setError(result.message || 'Failed to send verification code');
      }
    } catch (error) {
      setError(error.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP only (move to password setting)
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp) {
      setError('Please enter the verification code');
      return;
    }

    if (otp.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: In a complete implementation, verify OTP with server here
      // For now, just move to password setting step
      setStep(3); // Move to password setting step

    } catch (error) {
      setError(error.message || 'Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Set new password after OTP verification
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiClient.verifyOTP(email, otp, newPassword);
      if (result.success) {
        setStep(4); // Move to success step
      } else {
        setError(result.message || 'Failed to reset password');
      }
    } catch (error) {
      setError(error.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 4: Success - back to login
  if (step === 4) {
    return (
      <AuthLayout
        title="Password Reset Successful"
        footer=""
      >
        <div className="space-y-4 bg-black p-6 rounded-lg text-center">
          <p className="text-green-400 text-sm">Your password has been reset successfully!</p>
          <p className="text-gray-400 text-sm mb-6">You can now log in with your new password.</p>
          <Button type="button" className="w-full bg-blue-600 hover:bg-blue-700 text-white cursor-pointer" variant="cta" onClick={() => setView('signin')}>
            Back to Sign In
          </Button>
        </div>
      </AuthLayout>
    );
  }

  // Step 3: Set new password form
  if (step === 3) {
    return (
      <AuthLayout
        title="Set New Password"
        footer=""
      >
        <form onSubmit={handleResetPassword} className="space-y-4 bg-black p-6 rounded-lg">
          {error && <div className="text-red-400 text-sm mb-4">{error}</div>}
          <p className="text-gray-400 text-sm mb-4">
            Code verified successfully! Please create a new password for your account.
          </p>

          <InputField
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            isPassword
          />

          <InputField
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            isPassword
          />

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white cursor-pointer" variant="cta" disabled={isLoading}>
            {isLoading ? 'Setting Password...' : 'Set Password'}
          </Button>
        </form>
      </AuthLayout>
    );
  }

  // Step 2: OTP verification form
  if (step === 2) {
    return (
      <AuthLayout
        title="Verify Code"
        footer={
          <>
            <a href="#" onClick={() => { setStep(1); setMessage('') }} className="font-semibold text-blue-400 hover:text-blue-300">Use different email</a>
          </>
        }
      >
        <form onSubmit={handleVerifyOTP} className="space-y-4 bg-black p-6 rounded-lg">
          {error && <div className="text-red-400 text-sm mb-4">{error}</div>}
          <p className="text-gray-400 text-sm mb-4">
            We've sent a verification code to <strong>{email}</strong>. Enter the 6-digit code below.
          </p>

          <InputField
            label="Verification Code"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter 6-digit code"
            maxLength="6"
          />

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white cursor-pointer" variant="cta" disabled={isLoading}>
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </Button>
        </form>
      </AuthLayout>
    );
  }

  // Step 1: Email input form
  return (
    <AuthLayout
      title="Reset Password"
      footer={
        <>
          Remember your password? <a href="#" onClick={() => setView('signin')} className="font-semibold text-blue-400 hover:text-blue-300">Sign In</a>
        </>
      }
    >
      <form onSubmit={handleSendOTP} className="space-y-4 bg-black p-6 rounded-lg">
        {error && <div className="text-red-400 text-sm mb-4">{error}</div>}
        {message && <div className="text-green-400 text-sm mb-4">{message}</div>}
        <p className="text-gray-400 text-sm mb-4">Enter your email address and we'll send you a verification code to reset your password.</p>
        <InputField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white cursor-pointer" variant="cta" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send Verification Code'}
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
      encryptionClient.setToken(result.token);
      setView('dashboard');
    } catch (error) {
      // Error message is now user-friendly from the API client
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back" footer={<><a href="#" onClick={() => setView('forgot-password')} className="font-semibold text-blue-400 hover:text-blue-300 block mb-2">Forgot Password?</a> Don't have an account? <a href="#" onClick={() => setView('signup')} className="font-semibold text-green-400 hover:text-green-300">Sign Up</a></>}>
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


const SettingsModal = ({ setView, handleDeleteAccountRequest, handleClearAllChatsRequest }) => {
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1: Send email, 2: Enter OTP, 3: Enter new password
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePasswordReset = async () => {
    setResetError('');
    setResetMessage('');
    setIsSendingReset(true);

    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (!currentUser.email) {
        setResetError('User email not found. Please sign in again.');
        return;
      }

      const result = await apiClient.forgotPassword(currentUser.email);
      if (result.success) {
        setResetMessage('Verification code sent to your email!');
        setResetStep(2); // Move to OTP verification step
      } else {
        setResetError(result.message || 'Failed to send verification code');
      }
    } catch (error) {
      setResetError(error.message || 'Failed to send verification code');
    } finally {
      setIsSendingReset(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOTP = async () => {
    setResetError('');
    setIsSendingReset(true);

    try {
      // Just move to password setting step (frontend-only verification for now)
      setResetStep(3);
    } catch (error) {
      setResetError(error.message || 'Failed to verify code');
    } finally {
      setIsSendingReset(false);
    }
  };

  // Handle password reset
  const handleSetPassword = async () => {
    setResetError('');

    if (!newPassword || !confirmPassword) {
      setResetError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters long');
      return;
    }

    setIsSendingReset(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (!currentUser.email) {
        setResetError('User session expired. Please sign in again.');
        return;
      }

      const result = await apiClient.verifyOTP(currentUser.email, otp, newPassword);
      if (result.success) {
        setResetMessage('Password reset successfully!');
        setResetStep(1); // Reset to initial state
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setResetError(result.message || 'Failed to reset password');
      }
    } catch (error) {
      setResetError(error.message || 'Failed to reset password');
    } finally {
      setIsSendingReset(false);
    }
  };

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

          {/* Password Reset Section */}
          <div className="border border-blue-500/20 bg-blue-500/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiLock className="w-4 h-4 text-blue-400" />
              <h4 className="text-sm font-medium text-blue-400">Reset Password</h4>
            </div>
            {resetStep === 1 ? (
              <>
                <p className="text-xs text-zinc-400 mb-4">Send a password reset email to your account email address.</p>
                {resetMessage && <div className="text-green-400 text-sm bg-green-900/20 border border-green-500/30 rounded-lg p-3 mb-4">{resetMessage}</div>}
                {resetError && <div className="text-red-400 text-sm mb-4">{resetError}</div>}
                <button
                  onClick={handlePasswordReset}
                  disabled={isSendingReset}
                  className="px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSendingReset ? 'Sending...' : 'Send Reset Email'}
                </button>
              </>
            ) : resetStep === 2 ? (
              <>
                <p className="text-xs text-zinc-400 mb-4">Enter the 6-digit verification code from your email.</p>
                {resetError && <div className="text-red-400 text-sm mb-4">{resetError}</div>}
                <InputField
                  label="Verification Code"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength="6"
                />
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => { setResetStep(1); setOtp(''); setResetError(''); setResetMessage(''); }}
                    className="px-3 py-2 text-xs font-medium text-zinc-300 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleVerifyOTP}
                    disabled={isSendingReset}
                    className="flex-1 px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSendingReset ? 'Verifying...' : 'Verify Code'}
                  </button>
                </div>
              </>
            ) : resetStep === 3 ? (
              <>
                <p className="text-xs text-zinc-400 mb-4">Code verified! Enter your new password.</p>
                {resetError && <div className="text-red-400 text-sm mb-4">{resetError}</div>}
                <InputField
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  isPassword
                />
                <InputField
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  isPassword
                />
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => { setResetStep(2); setNewPassword(''); setConfirmPassword(''); setResetError(''); }}
                    className="px-3 py-2 text-xs font-medium text-zinc-300 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSetPassword}
                    disabled={isSendingReset}
                    className="flex-1 px-3 py-2 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSendingReset ? 'Setting...' : 'Set Password'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-zinc-400 mb-4">{resetMessage || 'Password reset successfully!'}</p>
                <button
                  onClick={() => { setResetStep(1); setOtp(''); setNewPassword(''); setConfirmPassword(''); setResetMessage(''); }}
                  className="px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                >
                  Done
                </button>
              </>
            )}
          </div>

          {/* Clear All Chats Section */}
          <div className="border border-yellow-500/20 bg-yellow-500/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiTrash2 className="w-4 h-4 text-yellow-400" />
              <h4 className="text-sm font-medium text-yellow-400">Clear Chat History</h4>
            </div>
            <p className="text-xs text-zinc-400 mb-4">Delete all your chat conversations. This action cannot be undone.</p>
            <button
              onClick={() => { handleClearAllChatsRequest(); setView('dashboard'); }}
              className="px-3 py-2 text-xs font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors cursor-pointer"
            >
              Clear All Chats
            </button>
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

const UserProfileMenu = ({ user, setView, handleDeleteRequest }) => {
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
            <span className="text-sm font-medium text-white">{user?.email || 'Anonymous User'}</span>
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


const PastChatsList = ({ user, chats, currentChatId, setCurrentChatId, createNewChat, updateChat, handleDeleteRequest, setView }) => {
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
      <div className="p-4 flex-shrink-0 border-b border-gray-800">
        <img src="/LOGO.png" alt="Logo" className="h-7" />
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
          <UserProfileMenu user={user} setView={setView} handleDeleteRequest={handleDeleteRequest} />
      </div>

    </div>
  );
};


const ChatInterface = ({ currentChat, handleUserSubmit }) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState('openai/gpt-3.5-turbo');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [modelSwitchMessage, setModelSwitchMessage] = useState('');
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState(null); // For image upload
  const [imagePreview, setImagePreview] = useState(null); // For image preview
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null); // Ref for event delegation
  const textareaRef = useRef(null);
  const modelSelectorRef = useRef(null);
  const fileInputRef = useRef(null);

  // Free OpenRouter models (including vision models)
  const freeModels = [
    { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', vision: false },
    { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash', vision: true },
    { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1', vision: false },
    { id: 'deepseek/deepseek-chat-v3.1:free', name: 'DeepSeek Chat v3.1', vision: false },
    { id: 'deepseek/deepseek-chat-v3-0324:free', name: 'DeepSeek Chat v3', vision: false },
    { id: 'deepseek/deepseek-r1-distill-llama-70b:free', name: 'DeepSeek R1 Distill 70B', vision: false },
    { id: 'deepseek/deepseek-r1-0528:free', name: 'DeepSeek R1 0528', vision: false },
    { id: 'deepseek/deepseek-r1-0528-qwen3-8b:free', name: 'DeepSeek R1 Qwen3 8B', vision: false },
    { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B', vision: false },
    { id: 'meta-llama/llama-3.3-8b-instruct:free', name: 'Llama 3.3 8B', vision: false },
    { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B', vision: false },
    { id: 'meta-llama/llama-3.2-1b-instruct:free', name: 'Llama 3.2 1B', vision: false },
    { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B', vision: false },
    { id: 'meta-llama/llama-4-maverick:free', name: 'Llama 4 Maverick', vision: true },
    { id: 'meta-llama/llama-4-scout:free', name: 'Llama 4 Scout', vision: true },
    { id: 'qwen/qwen-2.5-72b-instruct:free', name: 'Qwen 2.5 72B', vision: false },
    { id: 'qwen/qwen-2.5-coder-32b-instruct:free', name: 'Qwen 2.5 Coder 32B', vision: false },
    { id: 'qwen/qwen2.5-vl-72b-instruct:free', name: 'Qwen 2.5 VL 72B', vision: true },
    { id: 'qwen/qwen2.5-vl-32b-instruct:free', name: 'Qwen 2.5 VL 32B', vision: true },
    { id: 'qwen/qwen3-235b-a22b:free', name: 'Qwen3 235B', vision: false },
    { id: 'qwen/qwen3-30b-a3b:free', name: 'Qwen3 30B', vision: false },
    { id: 'qwen/qwen3-14b:free', name: 'Qwen3 14B', vision: false },
    { id: 'qwen/qwen3-8b:free', name: 'Qwen3 8B', vision: false },
    { id: 'qwen/qwen3-4b:free', name: 'Qwen3 4B', vision: false },
    { id: 'qwen/qwen3-coder:free', name: 'Qwen3 Coder', vision: false },
    { id: 'qwen/qwen-2-7b-instruct:free', name: 'Qwen 2 7B Instruct', vision: false },
    { id: 'google/gemma-3-27b-it:free', name: 'Gemma 3 27B', vision: true },
    { id: 'google/gemma-3-12b-it:free', name: 'Gemma 3 12B', vision: true },
    { id: 'google/gemma-3-4b-it:free', name: 'Gemma 3 4B', vision: true },
    { id: 'google/gemma-3n-e4b-it:free', name: 'Gemma 3N E4B', vision: false },
    { id: 'google/gemma-3n-e2b-it:free', name: 'Gemma 3N E2B', vision: false },
    { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2 9B', vision: false },
    { id: 'google/gemini-flash-1.5', name: 'Gemini Flash 1.5', vision: false },
    { id: 'mistralai/mistral-small-3.2-24b-instruct:free', name: 'Mistral Small 3.2 24B', vision: true },
    { id: 'mistralai/mistral-small-3.1-24b-instruct:free', name: 'Mistral Small 3.1 24B', vision: true },
    { id: 'mistralai/mistral-small-24b-instruct-2501:free', name: 'Mistral Small 24B 2501', vision: false },
    { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B', vision: false },
    { id: 'mistralai/mistral-nemo:free', name: 'Mistral Nemo', vision: false },
    { id: 'mistralai/devstral-small-2505:free', name: 'Devstral Small', vision: false },
    { id: 'moonshotai/kimi-dev-72b:free', name: 'Kimi Dev 72B', vision: false },
    { id: 'moonshotai/kimi-k2:free', name: 'Kimi K2', vision: false },
    { id: 'alibaba/tongyi-deepresearch-30b-a3b:free', name: 'Tongyi DeepResearch 30B', vision: false },
    { id: 'meituan/longcat-flash-chat:free', name: 'LongCat Flash', vision: false },
    { id: 'nvidia/nemotron-nano-9b-v2:free', name: 'Nemotron Nano 9B', vision: false },
    { id: 'openai/gpt-oss-20b:free', name: 'GPT OSS 20B', vision: false },
    { id: 'z-ai/glm-4.5-air:free', name: 'GLM 4.5 Air', vision: false },
    { id: 'tencent/hunyuan-a13b-instruct:free', name: 'Hunyuan A13B', vision: false },
    { id: 'tngtech/deepseek-r1t2-chimera:free', name: 'DeepSeek R1T2 Chimera', vision: false },
    { id: 'tngtech/deepseek-r1t-chimera:free', name: 'DeepSeek R1T Chimera', vision: false },
    { id: 'microsoft/mai-ds-r1:free', name: 'MAI DS R1', vision: false },
    { id: 'shisa-ai/shisa-v2-llama3.3-70b:free', name: 'Shisa v2 Llama 3.3 70B', vision: false },
    { id: 'arliai/qwq-32b-arliai-rpr-v1:free', name: 'QwQ 32B RPR', vision: false },
    { id: 'agentica-org/deepcoder-14b-preview:free', name: 'DeepCoder 14B', vision: false },
    { id: 'nousresearch/deephermes-3-llama-3-8b-preview:free', name: 'DeepHermes 3 Llama 8B', vision: false },
    { id: 'cognitivecomputations/dolphin3.0-mistral-24b:free', name: 'Dolphin 3.0 Mistral 24B', vision: false },
    { id: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free', name: 'Dolphin Mistral 24B Venice', vision: false },
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
        setModelSearchQuery(''); // Clear search when closing
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
    setModelSearchQuery(''); // Clear search when selecting
    setModelSwitchMessage(`Successfully switched to ${model.name}`);
  };

  // Filter models based on search query and image selection
  const filteredModels = freeModels.filter(model => {
    // If image is selected, only show vision models
    if (selectedImage) {
      if (!model.vision) return false;
    }
    
    // Apply search filter
    return model.name.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
           model.id.toLowerCase().includes(modelSearchQuery.toLowerCase());
  });

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Auto-switch to a vision model if current model doesn't support vision
      const currentModelSupportsVision = freeModels.find(m => m.id === selectedModel)?.vision;
      if (!currentModelSupportsVision) {
        setSelectedModel('google/gemini-2.0-flash-exp:free');
        setModelSwitchMessage('Switched to Gemini 2.0 Flash for image processing');
      }
    }
  };

  // Remove selected image
  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };




  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((inputText.trim() === '' && !selectedImage) || isTyping) return;

    const userMessage = inputText.trim() || 'What is in this image?';
    const imageToSend = selectedImage;
    const imagePreviewToSend = imagePreview;
    
    setInputText('');
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsTyping(true);

    // Scroll to bottom when sending message with slight delay to ensure DOM update
    setTimeout(() => {
      scrollToBottom();
    }, 100);

    await handleUserSubmit(userMessage, selectedModel, imageToSend, imagePreviewToSend);

    setIsTyping(false);
  };

  // Sort messages by timestamp for proper display order
  const sortedMessages = currentChat?.messages?.sort((a, b) => {
    const timestampA = new Date(a.createdAt || a.timestamp || 0);
    const timestampB = new Date(b.createdAt || b.timestamp || 0);
    return timestampA - timestampB;
  }) || [];

  const isNewChat = !currentChat || !sortedMessages || sortedMessages.length === 0;

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Messages Area - with bottom padding to prevent crossing into input */}
      <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-6 pb-32 space-y-6 scrollbar-hide">
        {isNewChat ? (
           <div className="flex h-full flex-col items-center justify-center text-center">
             <div className="w-16 h-16 rounded-full bg-gray-950 flex items-center justify-center mb-4 border-2 border-gray-700">
                <FiUser size={32} className="text-white"/>
            </div>
            <h2 className="text-2xl font-semibold text-gray-300">Ready when you are.</h2>
          </div>
        ) : (
          <>
            {sortedMessages.map((msg, index) => (
              <div key={index} className={`flex items-start gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`text-white ${
                    msg.role === 'user'
                      ? 'max-w-2xl bg-gray-800 p-3 rounded-xl'
                      : 'max-w-4xl'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <>
                      {msg.imageUrl && (
                        <img 
                          src={msg.imageUrl} 
                          alt="Uploaded" 
                          className="max-w-sm max-h-60 rounded-lg mb-2" 
                        />
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content || ''}</p>
                    </>
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
        {/* Model switch message */}
        {modelSwitchMessage && (
          <div className="w-full mx-auto mb-3 px-4 py-3 bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-500/40 rounded-2xl text-center shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-white">{modelSwitchMessage}</p>
            </div>
          </div>
        )}
        
        <form
          onSubmit={handleSubmit}
          className="relative flex items-end w-[75%] mx-auto bg-gray-900 border py-1 border-gray-700 rounded-3xl shadow-lg"
        >
          {/* Model Selector */}
          <div className="relative flex-shrink-0 self-end mb-3" ref={modelSelectorRef}>
            <button
              type="button"
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="ml-3 px-3 py-2 text-xs text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-xl flex items-center gap-2 transition-colors border border-gray-600"
              disabled={isTyping}
            >
              <span className="max-w-[120px] truncate">
                {freeModels.find(m => m.id === selectedModel)?.name || 'Select Model'}
              </span>
              <FiMenu size={14} className={`transition-transform ${showModelSelector ? 'rotate-180' : ''}`} />
            </button>
            
            {showModelSelector && (
              <div className="absolute bottom-full mb-2 left-3 w-80 bg-gray-800 border border-gray-600 rounded-xl shadow-xl z-50">
                <div className="p-2">
                  {/* Search Input */}
                  <div className="mb-2">
                    <input
                      type="text"
                      value={modelSearchQuery}
                      onChange={(e) => setModelSearchQuery(e.target.value)}
                      placeholder="Search models..."
                      className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                    />
                  </div>
                  
                  <p className="text-xs text-gray-400 px-2 py-1 font-semibold mb-1">
                    {selectedImage ? (
                      <span className="text-blue-400">🖼️ Vision Models: {filteredModels.length} available</span>
                    ) : (
                      <>{filteredModels.length} of {freeModels.length} models</>
                    )}
                  </p>
                  
                  {/* Scrollable Model List */}
                  <div className="max-h-80 overflow-y-auto">
                    {filteredModels.length > 0 ? (
                      filteredModels.map((model) => (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => handleModelChange(model.id)}
                          className={`w-full text-left px-3 py-2.5 text-sm rounded-md transition-colors flex items-center gap-2 ${
                            selectedModel === model.id
                              ? 'bg-blue-600 text-white font-medium'
                              : 'text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {model.vision && <FiImage className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                          <span>{model.name}</span>
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">No models found</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="absolute bottom-full mb-2 left-16 bg-gray-800 border border-gray-600 rounded-lg p-2">
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="max-w-xs max-h-40 rounded" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Image Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 self-end mb-3 ml-3 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            disabled={isTyping}
            title="Add image"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>

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
          
          {/* Send Button */}
          <button
            type="submit"
            className={`flex-shrink-0 self-end mb-3 mr-4 p-2 rounded-full transition-colors cursor-pointer ${
                ((inputText.trim() || selectedImage) && !isTyping)
                ? 'bg-white text-black'
                : 'bg-gray-700 text-white'
            } disabled:bg-gray-800 disabled:cursor-not-allowed`}
            disabled={(inputText.trim() === '' && !selectedImage) || isTyping}
          >
            <FiArrowUp size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};


const Dashboard = ({ user, setView, chats, setChats, currentChatId, setCurrentChatId, handleDeleteRequest, handleUserSubmit, updateChat }) => {
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
              user={user}
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
            // Handle error messages stored as plain text
            if (msg.sessionId === 'error') {
              return {
                ...msg,
                content: msg.encryptedMessage  // This is actually a plain text error message
              };
            }

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
                // Fall back to showing a more informative message
                return {
                  ...msg,
                  content: `[🔒 Message cannot be decrypted - session key missing or corrupted. Session: ${msg.sessionId}]`
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

      // Sort messages by timestamp to ensure proper chronological order
      const sortedMessages = processedMessages.sort((a, b) => {
        const timestampA = new Date(a.createdAt || a.timestamp || 0);
        const timestampB = new Date(b.createdAt || b.timestamp || 0);
        return timestampA - timestampB;
      });

      // Update the chat with loaded messages
      setChats(prevChats => prevChats.map(chat =>
        chat.id === chatId ? { ...chat, messages: sortedMessages } : chat
      ));

    } catch (error) {
      console.error(`Error loading messages for chat ${chatId}:`, error);
      // If chat doesn't exist (404), remove it from local state
      if (error.message && error.message.includes('404')) {
        console.log(`Removing orphaned chat from local state: ${chatId}`);
        setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
        if (currentChatId === chatId) {
          setCurrentChatId(null);
        }
      }
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

  const handleUserSubmit = async (userMessage, selectedModel = 'openai/gpt-3.5-turbo', imageFile = null, imagePreviewUrl = null) => {
    // Convert image to base64 if provided
    let imageBase64 = null;
    if (imageFile) {
      imageBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          // Extract base64 data (remove data:image/...;base64, prefix)
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });
    }

    let targetChatId = currentChatId;
    let currentChats = chats;

    // Find the current chat object
    const currentChat = currentChats.find(chat => chat.id === targetChatId);

    if (!currentChat) {
      console.log('🎙️ [NEW CHAT] Creating new encrypted chat on backend');

      // Create new chat using backend API (always encrypted by default)
      const title = userMessage.split(' ').slice(0, 4).join(' ') || "New Chat";
      const newChat = await apiClient.createChat({
        title,
        encrypted: true // All chats are encrypted by default for security
      });

      // Use the chat ID as the session ID for consistency
      const actualChatId = newChat.id;
      const sessionId = actualChatId; // IMPORTANT: Use chat ID as session ID

      // GENERATE ENCRYPTION KEY for this session
      const keyResponse = await encryptionClient.generateKey(sessionId, user.id);
      const encryptionKey = keyResponse.key;

      // Store key in local state for immediate use
      setEncryptionSessions(prev => ({
        ...prev,
        [sessionId]: encryptionKey
      }));

      // Add to local state
      const updatedChats = [newChat, ...currentChats];
      setChats(updatedChats);
      setCurrentChatId(actualChatId);

      console.log(`🎙️ [NEW CHAT] Created encrypted chat with ID: ${actualChatId} (also used as session ID)`);

      // ENCRYPT USER MESSAGE
      console.log('🔐 [ENCRYPT] Encrypting user message for new chat...');
      const encryptedUserMessage = await encryptionClient.encrypt(userMessage, sessionId);

      // IMMEDIATELY show user message in UI (with encryption indicator)
      const newUserMessage = {
        role: 'user',
        content: userMessage, // Show plain text in UI
        imageUrl: imagePreviewUrl, // Store image preview
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
        selectedModel, // Use selected model
        true, // encrypted flag
        sessionId, // session ID for encryption
        user.id, // user ID for database lookup
        imageBase64 // image data
      );

      let aiContent;
      let encryptedAiResponse;
      let aiIv;

      // Check if API returned an error object
      if (aiResponseData && aiResponseData.metadata && aiResponseData.metadata.raw) {
        // API error with metadata - extract the raw error message
        console.log('❌ [AI RESPONSE] API returned error with metadata:', aiResponseData);
        aiContent = `❌ **Model Error**\n\n${aiResponseData.metadata.raw}`;
        encryptedAiResponse = null;
        aiIv = null;
      } else if (aiResponseData && aiResponseData.error) {
        // API error with basic error field
        console.log('❌ [AI RESPONSE] API returned error:', aiResponseData.error);
        aiContent = `❌ **Model Error**\n\n${aiResponseData.error}`;
        encryptedAiResponse = null;
        aiIv = null;
      } else if (typeof aiResponseData === 'string') {
        // Legacy error string format
        console.log('❌ [AI RESPONSE] API returned error string:', aiResponseData);
        aiContent = `❌ **Model Error**\n\n${aiResponseData}`;
        encryptedAiResponse = null;
        aiIv = null;
      } else {
        // Success - decrypt the response
        const aiResponse = await encryptionClient.decrypt(
          aiResponseData.response,  // encryptedData
          aiResponseData.iv,        // iv
          sessionId                 // sessionId
        );
        console.log(`🤖 [AI RESPONSE] Decrypted and got response (${aiResponse.decrypted_data.length} chars)`);
        aiContent = aiResponse.decrypted_data;
        encryptedAiResponse = aiResponseData.response;
        aiIv = aiResponseData.iv;
      }

      // Store ENCRYPTED messages in database (backend will only store encrypted data)
      await apiClient.storeEncryptedMessage(
        actualChatId,
        userMessage,
        encryptedUserMessage.encrypted_data,
        encryptedUserMessage.iv,
        sessionId,
        'user'
      );
      
      if (encryptedAiResponse) {
        // Store encrypted AI response
        await apiClient.storeEncryptedMessage(
          actualChatId,
          aiContent,
          encryptedAiResponse,
          aiIv,
          sessionId,
          'ai'
        );
      } else {
        // Store error message as plain text
        await apiClient.storeEncryptedMessage(
          actualChatId,
          aiContent,
          aiContent,
          '',
          'error',
          'ai'
        );
      }

      // Replace thinking message with actual response
      const actualAIMessage = {
        role: 'ai',
        content: aiContent,
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
        console.log('🔑 [ENCRYPTION] No key in memory for session:', sessionId);
        console.log('🔑 [ENCRYPTION] Backend will load key from database during decrypt operation');
        // No need to generate a new key - the backend will load it from database
        // when we call encrypt/decrypt endpoints
      }

      // IMMEDIATELY show encrypted user message in UI
      const encryptedUserMessage = {
        role: 'user',
        content:userMessage,
        imageUrl: imagePreviewUrl,
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
        selectedModel, // Use selected model
        true, // encrypted flag
        sessionId, // session ID for encryption
        user.id, // user ID for database lookup
        imageBase64 // image data
      );

      // Backend will decrypt, process with AI, encrypt response, and return encrypted response
      console.log('✅ [ENCRYPTED CHAT] Response received, updating UI and database');

      let aiContent;
      let encryptedAiResponse;
      let aiIv;

      if (typeof aiResponseData === 'string') {
        // API error returned fallback message
        console.log('❌ [ENCRYPTED CHAT] API error:', aiResponseData);
        aiContent = aiResponseData;
        encryptedAiResponse = null;
        aiIv = null;
      } else {
        // Normal case - decrypt the encrypted AI response
        const decryptResult = await encryptionClient.decrypt(
          aiResponseData.response,  // encryptedData
          aiResponseData.iv,        // iv
          sessionId                 // sessionId
        );
        aiContent = decryptResult.decrypted_data;
        encryptedAiResponse = aiResponseData.response;
        aiIv = aiResponseData.iv;
      }

      // STORE BOTH USER MESSAGE AND AI RESPONSE IN DATABASE
      console.log('💾 [ENCRYPTED CHAT] Storing messages in database...');
      await apiClient.storeEncryptedMessage(
        currentChat.id,
        userMessage,  // Plain text for database reference
        encryptedMessage.encrypted_data,  // Encrypted user message
        encryptedMessage.iv,
        sessionId,
        'user'
      );

      if (encryptedAiResponse) {
        // Store encrypted AI response
        await apiClient.storeEncryptedMessage(
          currentChat.id,
          aiContent,
          encryptedAiResponse,
          aiIv,
          sessionId,
          'ai'
        );
      } else {
        // Store error message as plain text
        await apiClient.storeEncryptedMessage(
          currentChat.id,
          aiContent,
          aiContent,
          '',
          'error',
          'ai'
        );
      }

      console.log('✅ [ENCRYPTED CHAT] Messages stored successfully');

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
        imageUrl: imagePreviewUrl,
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
      const aiResponse = await apiClient.generateAiResponse(userMessage, contextMessages.slice(0, -1), selectedModel, false, null, null, imageBase64); // Pass selected model and image
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
      case 'forgot-password':
        return <ForgotPasswordPage setView={setView} />;
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
          <SettingsModal setView={setView} handleDeleteAccountRequest={() => handleDeleteRequest('account')} handleClearAllChatsRequest={() => handleDeleteRequest('all_chats')} />
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
