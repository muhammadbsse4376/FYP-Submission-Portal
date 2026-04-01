export const Card = ({ children, className }) => (
    <div className={`bg-white dark:bg-slate-900 shadow rounded-xl p-4 ${className}`}>{children}</div>
);

export const CardHeader = ({ children }) => <div className="mb-2">{children}</div>;
export const CardTitle = ({ children }) => <h3 className="font-bold">{children}</h3>;
export const CardContent = ({ children }) => <div>{children}</div>;
export const CardDescription = ({ children }) => <p className="text-sm text-gray-500">{children}</p>;