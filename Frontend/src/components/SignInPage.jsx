import React, { useState } from 'react';
import AuthLayout from './AuthLayout';
import InputField from './InputField';
import Button from './Button';

const SignInPage = ({ setView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });

  const validateEmail = (value) => {
    if (!value) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Enter a valid email address';
    return '';
  };

  const validatePassword = (value) => {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    setErrors({ email: emailError, password: passwordError });
    if (emailError || passwordError) return;
    // Simulate API call
    console.log("Signing in...", { email });
    setView('dashboard');
  };

  return (
    <AuthLayout title="Welcome Back" footer={<>Don't have an account? <a href="#" onClick={() => setView('signup')} className="font-semibold text-green-400 hover:text-green-300">Sign Up</a></>}>
      <form onSubmit={handleSubmit} className="space-y-4 bg-black p-6 rounded-lg">
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
          required
          error={errors.password}
        />
        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white" variant="cta">Sign In</Button>
      </form>
    </AuthLayout>
  );
};

export default SignInPage;
