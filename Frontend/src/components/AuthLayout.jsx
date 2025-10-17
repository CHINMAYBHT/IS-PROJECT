const AuthLayout = ({ title, children, footer }) => (
  <div className="min-h-screen flex items-center justify-center bg-black p-4">
    <div className="w-full max-w-sm bg-black p-8 rounded-xl shadow-2xl border border-gray-800">
      <h2 className="text-3xl font-bold text-center text-white mb-6">{title}</h2>
      {children}
      <p className="mt-6 text-center text-sm text-gray-400">{footer}</p>
    </div>
  </div>
);

export default AuthLayout;
