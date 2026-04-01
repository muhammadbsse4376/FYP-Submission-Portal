export const Badge = ({ children, className }) => (
    <span className={`bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-xs ${className}`}>{children}</span>
);