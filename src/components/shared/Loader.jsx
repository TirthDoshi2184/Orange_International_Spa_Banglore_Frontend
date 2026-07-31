const Loader = ({ label = "Loading..." }) => (
  <div className="flex items-center justify-center py-12 text-gray-500">
    <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mr-3" />
    {label}
  </div>
);

export default Loader;