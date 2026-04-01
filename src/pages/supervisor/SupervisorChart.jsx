import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["#0d9488", "#f59e0b", "#6366f1"];

export default function SupervisorChart({ data }) {
    const chartData = data && data.length > 0 ? data : [
        { name: "Approved", value: 0 },
        { name: "Pending", value: 0 },
        { name: "Reviews", value: 0 },
    ];

    return (
        <div className="bg-white p-6 rounded-xl shadow-md h-96 overflow-hidden">
            <h2 className="mb-4 font-semibold text-gray-700">Project Status Overview</h2>
            <ResponsiveContainer width="90%" height="90%">
                <BarChart data={chartData}>
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {chartData.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
