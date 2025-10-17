import React, { useState } from 'react';
import AuthLayout from './AuthLayout';
import InputField from './InputField';
import Button from './Button';
import { getPasswordStrength } from '../utils/password';

const SignUpPage = ({ setView }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const strength = password.length > 0 ? getPasswordStrength(password) : null;

  const validateName = (value) => {
    if (!value) return 'Full name is required';
    if (value.trim().split(' ').length < 2) return 'Enter first and last name';
    return '';
  };

  const validateEmail = (value) => {
    if (!value) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Enter a valid email address';
    return '';
  };

  const validatePassword = (value) => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    return '';
  };

  const validateConfirm = (value) => {
    if (!value) return 'Confirm your password';
    if (value !== password) return 'Passwords do not match';
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fullNameError = validateName(fullName);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmError = validateConfirm(confirmPassword);
    setErrors({ fullName: fullNameError, email: emailError, password: passwordError, confirmPassword: confirmError });
    if (fullNameError || emailError || passwordError || confirmError) return;
    if (strength && strength.text === "Too Short") return;
    // Simulate call
    console.log("Signing up...", { fullName, email });
    setView('dashboard');
  };

  return (
    <AuthLayout title="Create Account" footer={<>Already have an account? <a href="#" onClick={() => setView('signin')} className="font-semibold text-blue-400 hover:text-blue-300">Sign In</a></>}>
      <form onSubmit={handleSubmit} className="space-y-4 bg-black p-6 rounded-lg ">
        <InputField
          label="Full Name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          onBlur={() => setErrors((prev) => ({ ...prev, fullName: validateName(fullName) }))}
          placeholder="John Doe"
          required
          error={errors.fullName}
        />
        <InputField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setErrors((prev) => ({ ...prev, email: validateEmail(email) }))}
          placeholder="you@example.com"
          required
          error={errors.email}
        />
        <InputField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setErrors((prev) => ({ ...prev, password: validatePassword(password) }))}
          placeholder="••••••••"
          isPassword
          strength={strength}
          required
          error={errors.password}
        />
        <InputField
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onBlur={() => setErrors((prev) => ({ ...prev, confirmPassword: validateConfirm(confirmPassword) }))}
          placeholder="••••••••"
          isPassword
          required
          error={errors.confirmPassword}
        />
        <Button type="submit" className="w-full" variant="cta">Sign Up</Button>
      </form>
    </AuthLayout>
  );
};

export default SignUpPage;
