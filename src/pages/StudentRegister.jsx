import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
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
            await API.post("/auth/register-student", {
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
            <div className="min-h-screen relative overflow-hidden bg-slate-100 flex flex-col items-center justify-center px-4">
                <div className="pointer-events-none absolute -top-28 -left-28 h-72 w-72 rounded-full bg-teal-200/35 blur-3xl" />
                <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-emerald-100/35 blur-3xl" />

                <div className="relative bg-white shadow-lg rounded-2xl p-10 w-full max-w-md border border-gray-300 text-center">
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
                        onClick={() => navigate("/login")}
                        className="px-6 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-500 transition"
                    >
                        Back to Login
                    </button>
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
                            Student Registration
                        </h1>
                        <p className="mt-4 max-w-md text-sm md:text-base text-gray-600 leading-relaxed">
                            International Islamic University Islamabad. Create your student account to start your Final Year Project journey.
                        </p>
                    </div>

                    <div className="mt-10 rounded-2xl border border-teal-200 bg-teal-50 p-4">
                        <p className="text-sm text-gray-700 leading-relaxed">
                            Use your official IIUI email address to submit your registration request.
                        </p>
                    </div>
                </section>

                <section className="p-6 sm:p-8 md:p-10 lg:p-12">
                    <div className="mb-7">
                        <h2 className="font-serif text-2xl md:text-3xl text-slate-900">Create account</h2>
                        <p className="mt-2 text-sm text-slate-600">
                            Fill in your details to submit registration for admin approval.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm mb-1.5 font-medium text-gray-700">Full Name</label>
                            <input
                                id="name"
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition"
                            />
                        </div>

                        <div>
                            <label htmlFor="registration_number" className="block text-sm mb-1.5 font-medium text-gray-700">Registration Number</label>
                            <input
                                id="registration_number"
                                type="text"
                                name="registration_number"
                                value={form.registration_number}
                                onChange={handleChange}
                                placeholder="e.g., 4376/FOC/BSSE/F22"
                                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition"
                            />
                        </div>

                        <div>
                            <label htmlFor="semester" className="block text-sm mb-1.5 font-medium text-gray-700">Semester</label>
                            <div className="relative">
                                <select
                                    id="semester"
                                    name="semester"
                                    value={form.semester}
                                    onChange={handleChange}
                                    className={`semester-select w-full appearance-none rounded-xl border border-gray-300 px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition bg-white ${form.semester ? "text-gray-700" : "text-gray-400"}`}
                                >
                                    <option value="">Select Semester</option>
                                    {semesters.map((s) => <option key={s} value={s}>{s} Semester</option>)}
                                </select>
                                <svg
                                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.12l3.71-3.89a.75.75 0 111.08 1.04l-4.25 4.46a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm mb-1.5 font-medium text-gray-700">Email</label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="yourname@iiu.edu.pk"
                                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm mb-1.5 font-medium text-gray-700">Password</label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm mb-1.5 font-medium text-gray-700">Confirm Password</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                name="confirmPassword"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition"
                            />
                        </div>

                        {error && <p className="text-red-600 text-sm text-center">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-teal-500 disabled:opacity-60"
                        >
                            {loading ? "Submitting..." : "Register"}
                        </button>

                        <p className="text-center text-sm text-gray-500">
                            Already have an account?{" "}
                            <button
                                type="button"
                                onClick={() => navigate("/login")}
                                className="font-semibold text-teal-700 hover:text-teal-600 hover:underline"
                            >
                                Login here
                            </button>
                        </p>
                    </form>
                </section>
            </div>
        </div>
    );
}
