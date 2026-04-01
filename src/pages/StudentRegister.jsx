import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Logo from "../assets/iiui-logo.png";

const semesters = ["7th", "8th"];

export default function StudentRegister() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: "", registration_number: "", semester: "", email: "", password: "", confirmPassword: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!form.name || !form.registration_number || !form.semester || !form.email || !form.password || !form.confirmPassword) {
            setError("Please fill all fields!");
            return;
        }

        if (!form.email.toLowerCase().endsWith("@iiu.edu.pk")) {
            setError("Only @iiu.edu.pk emails are allowed.");
            return;
        }

        if (form.password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            await axios.post("http://localhost:5000/api/auth/register-student", {
                name: form.name,
                registration_number: form.registration_number,
                semester: form.semester,
                email: form.email,
                password: form.password,
            });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.error || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center px-4">
                <div className="bg-white shadow-lg rounded-2xl p-10 w-full max-w-md border border-slate-200 text-center">
                    <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-700 mb-2">Registration Completed!</h2>
                    <p className="text-gray-600 mb-6">
                        Your application has been sent to admin for approval. You will receive an email with your credentials once approved.
                    </p>
                    <button
                        onClick={() => navigate("/")}
                        className="px-6 py-2 bg-teal-700 text-white rounded-lg font-semibold hover:bg-teal-600 transition"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center pt-6 px-4 font-sans">
            <div className="text-center mb-6">
                <h1 className="text-3xl font-sans text-gray-700 tracking-wide">FYP Portal</h1>
                <img src={Logo} alt="IIUI Logo" className="w-20 mx-auto my-4" />
                <p className="font-serif text-base text-gray-700">Student Registration</p>
            </div>

            <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md border border-slate-200">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm mb-1 font-medium text-gray-700">Full Name</label>
                        <input type="text" name="name" value={form.name} onChange={handleChange}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 transition" />
                    </div>

                    <div>
                        <label className="block text-sm mb-1 font-medium text-gray-700">Registration Number</label>
                        <input type="text" name="registration_number" value={form.registration_number} onChange={handleChange}
                            placeholder="e.g., 4376/FOC/BSSE/F22"
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 transition" />
                    </div>

                    <div>
                        <label className="block text-sm mb-1 font-medium text-gray-700">Semester</label>
                        <select name="semester" value={form.semester} onChange={handleChange}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 transition bg-white">
                            <option value="">Select Semester</option>
                            {semesters.map(s => <option key={s} value={s}>{s} Semester</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm mb-1 font-medium text-gray-700">Email</label>
                        <input type="email" name="email" value={form.email} onChange={handleChange}
                            placeholder="yourname@iiu.edu.pk"
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 transition" />
                    </div>

                    <div>
                        <label className="block text-sm mb-1 font-medium text-gray-700">Password</label>
                        <input type="password" name="password" value={form.password} onChange={handleChange}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 transition" />
                    </div>

                    <div>
                        <label className="block text-sm mb-1 font-medium text-gray-700">Confirm Password</label>
                        <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 transition" />
                    </div>

                    {error && <p className="text-red-600 text-sm text-center">{error}</p>}

                    <button type="submit" disabled={loading}
                        className="w-full bg-teal-700 text-white py-3 text-sm rounded-lg font-semibold hover:bg-teal-600 transition-all duration-200 shadow-md disabled:opacity-60">
                        {loading ? "Submitting..." : "Register"}
                    </button>

                    <p className="text-center text-sm text-gray-500">
                        Already have an account?{" "}
                        <button type="button" onClick={() => navigate("/")} className="text-teal-700 font-semibold hover:underline">
                            Login here
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
}
