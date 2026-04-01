import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import ProtectedRoute from "./routes/ProtectedRoute";

// Student
import StudentDashboard from "./pages/StudentDashboard";
import StudentLayout from "./Layouts/StudentLayout";
import CreateGroup from "./pages/student/CreateGroup";
import SelectGroup from "./pages/student/SelectGroup";
import Project from "./pages/student/Project";
import Supervisors from "./pages/student/Supervisors";
import MyProject from "./pages/student/MyProject";
import SubmitProposal from "./pages/student/SubmitProposal";
import GroupRequests from "./pages/student/GroupRequests";
import TrackProgress from "./pages/student/TrackProgress";
import Meeting from "./pages/student/Meeting";
import Notifications from "./pages/student/Notifications";

// Supervisor
import SupervisorLayout from "./Layouts/SupervisorLayout";
import SupervisorDashboard from "./pages/supervisor/SupervisorDashboard";
import AssignedStudents from "./pages/supervisor/AssignedStudents";
import Meetings from "./pages/supervisor/Meetings";
import ProposalsReview from "./pages/supervisor/ProposalsReview";
import ProgressReview from "./pages/supervisor/ProgressReview";
import Notfs from "./pages/supervisor/Notfs";
import ApprovedProjects from "./pages/supervisor/ApprovedProjects";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminHome from "./pages/admin/AdminHome";
import ManageStudents from "./pages/admin/ManageStudents";
import ManageSupervisors from "./pages/admin/ManageSupervisors";
import ManageProjects from "./pages/admin/ManageProjects";
import AssignSupervisors from "./pages/admin/AssignSupervisors";
import Announcements from "./pages/admin/Announcements";
import Reports from "./pages/admin/Reports";
import SetMilestones from "./pages/admin/SetMilestones";
import PastProjects from "./pages/admin/PastProjects";
import PendingRequests from "./pages/admin/PendingRequests";
import StudentRegister from "./pages/StudentRegister";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<StudentRegister />} />

        <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
          <Route path="/StudentDashboard" element={<StudentLayout />}>
            <Route index element={<StudentDashboard />} />
          </Route>
          <Route path="/student" element={<StudentLayout />}>
            <Route path="CreateGroup" element={<CreateGroup />} />
            <Route path="SelectGroup" element={<SelectGroup />} />
            <Route path="Project" element={<Project />} />
            <Route path="Supervisors" element={<Supervisors />} />
            <Route path="MyProject" element={<MyProject />} />
            <Route path="SubmitProposal" element={<SubmitProposal />} />
            <Route path="GroupRequests" element={<GroupRequests />} />
            <Route path="TrackProgress" element={<TrackProgress />} />
            <Route path="Meeting" element={<Meeting />} />
            <Route path="Notifications" element={<Notifications />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["supervisor"]} />}>
          <Route path="/supervisor" element={<SupervisorLayout />}>
            <Route index element={<SupervisorDashboard />} />
            <Route path="assigned-students" element={<AssignedStudents />} />
            <Route path="meetings" element={<Meetings />} />
            <Route path="proposals-review" element={<ProposalsReview />} />
            <Route path="progress-review" element={<ProgressReview />} />
            <Route path="ApprovedProjects" element={<ApprovedProjects />} />
            <Route path="Notfs" element={<Notfs />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboard />}>
            <Route index element={<AdminHome />} />
            <Route path="pending-requests" element={<PendingRequests />} />
            <Route path="manage-students" element={<ManageStudents />} />
            <Route path="manage-supervisors" element={<ManageSupervisors />} />
            <Route path="assign-supervisors" element={<AssignSupervisors />} />
            <Route path="manage-projects" element={<ManageProjects />} />
            <Route path="set-milestones" element={<SetMilestones />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="past-projects" element={<PastProjects />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;