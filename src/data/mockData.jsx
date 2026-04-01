// mockData.js

export const mockStudents = [
    { id: 1, name: "Tayyab Malik", email: "tayyab@example.com", groupId: 1, projectId: 1, supervisorId: 1 },
    { id: 2, name: "Alice Johnson", email: "alice.johnson@example.com", groupId: null, projectId: null, supervisorId: null },
    { id: 3, name: "Bob Smith", email: "bob.smith@example.com", groupId: null, projectId: null, supervisorId: null },
    { id: 4, name: "Carol White", email: "carol.white@example.com", groupId: null, projectId: null, supervisorId: null }
];

export const mockGroups = [
    {
        id: 1,
        name: "AI Research Team",
        description: "Working on AI final year project",
        members: [1],
        capacity: 5,
        leaderId: 1,
        status: "Active"
    }
];

export const mockProjects = [
    {
        id: 1,
        title: "AI Attendance System",
        description: "Automated attendance system using AI",
        tags: ["AI", "ML"],
        supervisorId: 1,
        status: "in-progress"
    }
];

export const mockSupervisors = [
    {
        id: 1,
        name: "Dr. Ahmed Ali",
        email: "ahmed.ali@example.com",
        department: "CS",
        expertise: ["AI", "ML"],
        availableSlots: 2
    },
    {
        id: 2,
        name: "Dr. Sarah Khan",
        email: "sarah.khan@example.com",
        department: "Software Engineering",
        expertise: ["Web Development", "Cloud Computing", "DevOps"],
        availableSlots: 1
    },
    {
        id: 3,
        name: "Dr. Muhammad Hassan",
        email: "m.hassan@example.com",
        department: "Cyber Security",
        expertise: ["Network Security", "Cryptography", "Ethical Hacking"],
        availableSlots: 0
    },
    {
        id: 4,
        name: "Dr. Fatima Noor",
        email: "fatima.noor@example.com",
        department: "Data Science",
        expertise: ["Data Analysis", "Deep Learning", "Big Data"],
        availableSlots: 3
    }
];

// ✅ Expanded group requests with multiple students
export const mockGroupRequests = [
    { id: 1, fromStudentId: 2, message: "Can I join?", status: "pending", createdAt: new Date() },
    { id: 2, fromStudentId: 3, message: "I want to be part of your group.", status: "pending", createdAt: new Date() },
    { id: 3, fromStudentId: 4, message: "Please accept me.", status: "accepted", createdAt: new Date() }
];

export const mockDeliverables = [
    { id: 1, projectId: 1, title: "Proposal_V2.pdf", description: "Updated proposal", status: "approved", dueDate: new Date() },
    { id: 2, projectId: 1, title: "Design_Document.docx", description: "System design", status: "pending", dueDate: new Date() },
    { id: 3, projectId: 1, title: "Requirements.docx", description: "Detailed specs", status: "pending", dueDate: new Date() },
    { id: 4, projectId: 1, title: "Prototype.zip", description: "Working prototype", status: "pending", dueDate: new Date() }
];