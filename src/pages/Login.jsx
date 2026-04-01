import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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
            const res = await axios.post("http://localhost:5000/api/auth/login", {
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
            <div className="flex items-center justify-center min-h-screen bg-slate-100">
                <h1 className="text-3xl font-serif tracking-wide text-gray-700">
                    Welcome to FYP Portal
                </h1>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center pt-6 px-4 font-sans">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-sans text-gray-700 tracking-wide">FYP Portal</h1>
                <img src={Logo} alt="IIUI Logo" className="w-20 mx-auto my-4" />
                <p className="font-serif text-base text-gray-700">
                    Department of Software Engineering
                    <br />
                    International Islamic University Islamabad
                </p>
            </div>

            <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md border border-slate-200">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <p className="text-base font-semibold text-center mb-3 text-gray-700">Select Role</p>
                        <div className="flex justify-center gap-3">
                            {["student", "admin", "supervisor"].map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setRole(r)}
                                    className={`px-4 py-2 text-sm rounded-lg border transition-all duration-200 ${role === r
                                        ? "bg-teal-700 text-white border-teal-700 shadow"
                                        : "bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300"
                                        }`}
                                >
                                    {r.charAt(0).toUpperCase() + r.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm mb-1 font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            name="email"
                            autoComplete="email"
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1 font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            name="password"
                            autoComplete="current-password"
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {error && <p className="text-red-600 text-sm text-center -mt-1">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-teal-700 text-white py-3 text-sm rounded-lg font-semibold hover:bg-teal-600 transition-all duration-200 shadow-md disabled:opacity-60"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>

                    {role === "student" && (
                        <p className="text-center text-sm text-gray-500">
                            Don't have an account?{" "}
                            <button type="button" onClick={() => navigate("/register")} className="text-teal-700 font-semibold hover:underline">
                                Register here
                            </button>
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
};

export default Login;