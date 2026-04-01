import React from "react";

const Footer = () => {
    return (
        <footer className="bg-white dark:bg-slate-900 shadow-inner p-4 text-center text-sm text-slate-500 dark:text-slate-400 flex flex-col md:flex-row justify-center items-center gap-2">
            <span>© 2026 IIUI Department of Software Engineering. All rights reserved.</span>
            <span className="hidden md:inline">| Designed for FYP Portal by Muhammad Tayyab Qadri</span>
        </footer>
    );
};

export default Footer;