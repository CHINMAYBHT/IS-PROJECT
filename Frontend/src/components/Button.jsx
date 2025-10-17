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

export default Button;
