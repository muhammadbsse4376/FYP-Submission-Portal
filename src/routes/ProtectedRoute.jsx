import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

function decodeJwt(token) {
    try {
        const payload = token.split(".")[1];
        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        return JSON.parse(atob(base64));
    } catch {
        return null;
    }
}

export default function ProtectedRoute({ allowedRoles = [] }) {
    const location = useLocation();
    const token =
        localStorage.getItem("access_token") || localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    const payload = decodeJwt(token);
    const role = (localStorage.getItem("role") || payload?.role || "").toLowerCase();

    if (allowedRoles.length && !allowedRoles.map(r => r.toLowerCase()).includes(role)) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}