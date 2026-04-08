import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import Logo from "../assets/iiui-logo.png";

function decodeJwt(token) {
    try {
        const payload = token.split(".")[1];
        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        return JSON.parse(atob(base64));
    } catch {
        return null;
    }
}

const Login = () => {
    const navigate = useNavigate();

    const [showSplash, setShowSplash] = useState(true);
    const [role, setRole] = useState("student");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => setShowSplash(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Please fill all fields!");
            return;
        }

        setLoading(true);
        try {
            const res = await API.post("/auth/login", {
                email,
                password,
                role,
            });

            const token = res.data.access_token || res.data.token;
            if (!token) {
                setError("Login failed: token not returned by server.");
                return;
            }

            localStorage.setItem("access_token", token);
            localStorage.setItem("token", token);

            const payload = decodeJwt(token);
            const finalRole = (res.data.role || payload?.role || role || "").toLowerCase();
            localStorage.setItem("role", finalRole);
            if (res.data.name) localStorage.setItem("name", res.data.name);

            if (finalRole === "student") navigate("/StudentDashboard");
            else if (finalRole === "supervisor") navigate("/supervisor");
            else if (finalRole === "admin") navigate("/admin");
            else navigate("/");
        } catch (err) {
            setError(err.response?.data?.msg || err.response?.data?.error || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (showSplash) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center px-6">
                <div className="text-center text-gray-700">
                    <img src={Logo} alt="IIUI Logo" className="w-24 mx-auto mb-5" />
                    <h1 className="text-3xl md:text-4xl font-serif tracking-wide">FYP Portal</h1>
                    <p className="mt-2 text-gray-600 text-sm md:text-base">
                        International Islamic University Islamabad
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-slate-100 px-4 py-8 md:px-8 lg:px-12">
            <div className="pointer-events-none absolute -top-28 -left-28 h-72 w-72 rounded-full bg-teal-200/35 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-emerald-100/35 blur-3xl" />

            <div className="relative mx-auto grid w-full max-w-6xl items-stretch overflow-hidden rounded-3xl border border-gray-300 bg-white shadow-2xl shadow-slate-900/10 md:grid-cols-2">
                <section className="bg-gray-50 p-8 text-gray-700 md:p-12 flex flex-col justify-between border-r border-gray-200">
                    <div>
                        <img src={Logo} alt="IIUI Logo" className="w-16 md:w-20" />
                        <p className="mt-6 text-xs uppercase tracking-[0.28em] text-teal-700">
                            Final Year Project Submission Portal
                        </p>
                        <h1 className="mt-3 font-serif text-3xl md:text-4xl leading-tight">
                            International Islamic University Islamabad
                        </h1>
                        <p className="mt-4 max-w-md text-sm md:text-base text-gray-600 leading-relaxed">
                            Department of Software Engineering. Secure and centralized access for students, supervisors, and administrators.
                        </p>
                    </div>

                    <div className="mt-10 rounded-2xl border border-teal-200 bg-teal-50 p-4">
                        <p className="text-sm text-gray-700 leading-relaxed">
                            Please use your institutional credentials to continue.
                        </p>
                    </div>
                </section>

                <section className="p-6 sm:p-8 md:p-10 lg:p-12">
                    <div className="mb-7">
                        <h2 className="font-serif text-2xl md:text-3xl text-slate-900">Login</h2>
                        <p className="mt-2 text-sm text-slate-600">
                            Access your portal account and continue your FYP workflow.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <p className="text-sm font-semibold text-slate-700 mb-3">Select role</p>
                            <div className="grid grid-cols-3 gap-2">
                                {["student", "admin", "supervisor"].map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setRole(r)}
                                        className={`px-3 py-2 text-sm rounded-xl border transition-all duration-200 ${role === r
                                            ? "bg-teal-100 text-teal-700 border-teal-300 shadow"
                                            : "bg-white text-gray-700 border-gray-300 hover:border-teal-300 hover:bg-teal-50"
                                            }`}
                                    >
                                        {r.charAt(0).toUpperCase() + r.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm mb-1.5 font-medium text-slate-700">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@iiu.edu.pk"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm mb-1.5 font-medium text-slate-700">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                autoComplete="current-password"
                                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                            />
                        </div>

                        {error && <p className="text-red-600 text-sm text-center -mt-1">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-teal-500 disabled:opacity-60"
                        >
                            {loading ? "Logging in..." : "Login"}
                        </button>

                        {role === "student" && (
                            <p className="text-center text-sm text-slate-500">
                                Don&apos;t have an account?{" "}
                                <button
                                    type="button"
                                    onClick={() => navigate("/register")}
                                    className="font-semibold text-teal-700 hover:text-teal-600 hover:underline"
                                >
                                    Register here
                                </button>
                            </p>
                        )}
                    </form>
                </section>
            </div>
        </div>
    );
};

export default Login;