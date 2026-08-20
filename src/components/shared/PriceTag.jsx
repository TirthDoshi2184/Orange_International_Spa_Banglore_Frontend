const PriceTag = ({ amount, className = "" }) => (
  <span className={`font-sans tabular-nums ${className}`}>₹{Number(amount).toLocaleString("en-IN")}</span>
);

export default PriceTag;
