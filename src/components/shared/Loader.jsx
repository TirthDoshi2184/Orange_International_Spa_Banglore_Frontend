const Loader = ({ label = "Loading..." }) => (
  <div className="flex items-center justify-center py-12 text-ink-600 font-sans text-sm">
    <div className="w-5 h-5 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mr-3" />
    {label}
  </div>
);

export default Loader;
