const ErrorMessage = ({ message }) => {
  if (!message) return null;
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 my-4 font-sans">
      {message}
    </div>
  );
};

export default ErrorMessage;
