import { motion } from "framer-motion";

export default function StatCard({ title, value }) {
    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md"
        >
            <h3 className="text-sm text-gray-500">{title}</h3>
            <p className="text-3xl font-bold mt-2">{value}</p>
        </motion.div>
    );
}
