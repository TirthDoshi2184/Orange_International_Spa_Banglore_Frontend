const PriceTag = ({ amount, className = "" }) => (
  <span className={className}>₹{Number(amount).toLocaleString("en-IN")}</span>
);

export default PriceTag;