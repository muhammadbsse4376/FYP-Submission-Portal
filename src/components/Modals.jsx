import { motion } from "framer-motion";
export function Modal({ title, children, onClose }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-red-500 font-bold"
                    >
                        ✕
                    </button>
                </div>

                {children}
            </motion.div>
        </div>
    );
}
