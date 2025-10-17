// Simple password strength check simulation
export const getPasswordStrength = (password) => {
  if (password.length < 6) return { text: "Too Short", color: "text-red-400" };
  if (password.length < 10) return { text: "Weak", color: "text-yellow-400" };
  if (/[A-Z]/.test(password) && /\d/.test(password) && /[!@#$%^&*]/.test(password)) {
    return { text: "Strong", color: "text-green-400" };
  }
  return { text: "Moderate", color: "text-blue-400" };
};
