require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Candidate = require('../models/Candidate');
const CallLog = require('../models/CallLog');
const Interview = require('../models/Interview');
const WalkIn = require('../models/WalkIn');
const Attendance = require('../models/Attendance');
const Holiday = require('../models/Holiday');
const AuditLog = require('../models/AuditLog');
const Permission = require('../models/Permission');
const Invoice = require('../models/Invoice');
const TeamMember = require('../models/TeamMember');

async function seed() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ats_db';
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB for seeding...');

  // Clear all collections
  await Promise.all([
    User.deleteMany({}),
    Candidate.deleteMany({}),
    CallLog.deleteMany({}),
    Interview.deleteMany({}),
    WalkIn.deleteMany({}),
    Attendance.deleteMany({}),
    Holiday.deleteMany({}),
    AuditLog.deleteMany({}),
    Permission.deleteMany({}),
    Invoice.deleteMany({}),
    TeamMember.deleteMany({}),
  ]);
  console.log('Cleared all collections');

  // ── Users ──
  const users = await User.create([
    { name: 'Rahul Kumar', email: 'rahul@whm.com', employeeId: 'EMP001', password: 'password123', role: 'recruiter', isWFH: false },
    { name: 'Priya Sharma', email: 'priya@whm.com', employeeId: 'EMP002', password: 'password123', role: 'recruiter', isWFH: true },
    { name: 'Amit Singh', email: 'amit@whm.com', employeeId: 'EMP003', password: 'password123', role: 'recruiter', isWFH: false },
    { name: 'Neha Patel', email: 'neha@whm.com', employeeId: 'EMP004', password: 'password123', role: 'recruiter', isWFH: false },
    { name: 'Vikram Desai', email: 'vikram@whm.com', employeeId: 'EMP005', password: 'password123', role: 'recruiter', isWFH: true },
    { name: 'Suresh Menon', email: 'suresh@whm.com', employeeId: 'EMP006', password: 'password123', role: 'tl', isWFH: false },
    { name: 'Kavita Nair', email: 'kavita@whm.com', employeeId: 'EMP007', password: 'password123', role: 'manager', isWFH: false },
    { name: 'Rajesh Iyer', email: 'rajesh@whm.com', employeeId: 'EMP008', password: 'password123', role: 'admin', isWFH: false },
    { name: 'Deepak Verma', email: 'deepak@whm.com', employeeId: 'EMP009', password: 'password123', role: 'recruiter', isWFH: false },
    { name: 'Anita Reddy', email: 'anita@whm.com', employeeId: 'EMP010', password: 'password123', role: 'recruiter', isWFH: true },
  ]);
  console.log(`Created ${users.length} users`);

  // Seed TL - Recruiter relationships
  const tlUser = users.find(u => u.role === 'tl');
  const recruitersList = users.filter(u => u.role === 'recruiter');
  const teamMembersData = recruitersList.map(rec => ({
    teamLeaderId: tlUser._id,
    memberId: rec._id,
    role: 'recruiter',
  }));
  await TeamMember.create(teamMembersData);
  console.log(`Assigned ${teamMembersData.length} recruiters to Team Leader ${tlUser.name}`);

  const recruiter1 = users[0];
  const recruiter2 = users[1];
  const recruiter3 = users[2];
  const recruiter4 = users[3];
  const recruiter5 = users[4];

  // ── Candidates ──
  const candidateData = [
    { name: 'Arjun Mehta', email: 'arjun.mehta@email.com', phone: '9876543210', skills: ['JavaScript', 'React', 'Node.js'], experience: '3 years', currentCTC: '5 LPA', expectedCTC: '8 LPA', noticePeriod: '30 days', location: 'Mumbai', city: 'Mumbai', localArea: 'Andheri', source: 'Naukri', status: 'Interested', assignedRecruiter: recruiter1._id, assignedRecruiterName: recruiter1.name },
    { name: 'Sneha Gupta', email: 'sneha.g@email.com', phone: '9876543211', skills: ['Python', 'Django', 'AWS'], experience: '5 years', currentCTC: '12 LPA', expectedCTC: '18 LPA', noticePeriod: '60 days', location: 'Bangalore', city: 'Bangalore', localArea: 'Koramangala', source: 'LinkedIn', status: 'Interview Scheduled', assignedRecruiter: recruiter1._id, assignedRecruiterName: recruiter1.name },
    { name: 'Rohit Saxena', email: 'rohit.s@email.com', phone: '9876543212', skills: ['Java', 'Spring Boot', 'Microservices'], experience: '4 years', currentCTC: '8 LPA', expectedCTC: '12 LPA', noticePeriod: '45 days', location: 'Delhi', city: 'Delhi', localArea: 'Connaught Place', source: 'Indeed', status: 'New', assignedRecruiter: recruiter2._id, assignedRecruiterName: recruiter2.name },
    { name: 'Meera Joshi', email: 'meera.j@email.com', phone: '9876543213', skills: ['HR', 'Recruitment', 'Sourcing'], experience: '2 years', currentCTC: '3.5 LPA', expectedCTC: '5 LPA', noticePeriod: '15 days', location: 'Pune', city: 'Pune', localArea: 'Hinjewadi', source: 'Referral', status: 'Selected', assignedRecruiter: recruiter2._id, assignedRecruiterName: recruiter2.name },
    { name: 'Karan Malhotra', email: 'karan.m@email.com', phone: '9876543214', skills: ['Sales', 'Marketing', 'CRM'], experience: '6 years', currentCTC: '10 LPA', expectedCTC: '15 LPA', noticePeriod: '30 days', location: 'Mumbai', city: 'Mumbai', localArea: 'BKC', source: 'Naukri', status: 'Contacted', assignedRecruiter: recruiter3._id, assignedRecruiterName: recruiter3.name },
    { name: 'Divya Rao', email: 'divya.r@email.com', phone: '9876543215', skills: ['UI/UX', 'Figma', 'Photoshop'], experience: '3 years', currentCTC: '6 LPA', expectedCTC: '9 LPA', noticePeriod: '30 days', location: 'Hyderabad', city: 'Hyderabad', localArea: 'HITEC City', source: 'LinkedIn', status: 'HR Shortlist', assignedRecruiter: recruiter3._id, assignedRecruiterName: recruiter3.name },
    { name: 'Sanjay Tiwari', email: 'sanjay.t@email.com', phone: '9876543216', skills: ['BPO', 'Customer Service', 'English'], experience: '1 year', currentCTC: '2 LPA', expectedCTC: '3 LPA', noticePeriod: 'Immediate', location: 'Chennai', city: 'Chennai', localArea: 'OMR', source: 'Walk-In', status: 'Joined', assignedRecruiter: recruiter1._id, assignedRecruiterName: recruiter1.name, isWalkIn: true },
    { name: 'Pooja Bhatt', email: 'pooja.b@email.com', phone: '9876543217', skills: ['Accounting', 'Tally', 'Excel'], experience: '4 years', currentCTC: '4 LPA', expectedCTC: '6 LPA', noticePeriod: '30 days', location: 'Mumbai', city: 'Mumbai', localArea: 'Thane', source: 'Monster', status: 'Call Back', assignedRecruiter: recruiter4._id, assignedRecruiterName: recruiter4.name },
    { name: 'Varun Nanda', email: 'varun.n@email.com', phone: '9876543218', skills: ['DevOps', 'Docker', 'Kubernetes', 'Jenkins'], experience: '5 years', currentCTC: '14 LPA', expectedCTC: '20 LPA', noticePeriod: '90 days', location: 'Bangalore', city: 'Bangalore', localArea: 'Whitefield', source: 'LinkedIn', status: 'Documentation', assignedRecruiter: recruiter4._id, assignedRecruiterName: recruiter4.name },
    { name: 'Isha Kapoor', email: 'isha.k@email.com', phone: '9876543219', skills: ['Content Writing', 'SEO', 'Social Media'], experience: '2 years', currentCTC: '3 LPA', expectedCTC: '5 LPA', noticePeriod: '15 days', location: 'Delhi', city: 'Delhi', localArea: 'Noida', source: 'Company Website', status: 'Wrong Number', assignedRecruiter: recruiter5._id, assignedRecruiterName: recruiter5.name, appliedViaPublic: true },
    { name: 'Manish Agarwal', email: 'manish.a@email.com', phone: '9876543220', skills: ['Data Science', 'Python', 'Machine Learning'], experience: '3 years', currentCTC: '9 LPA', expectedCTC: '14 LPA', noticePeriod: '60 days', location: 'Pune', city: 'Pune', localArea: 'Kharadi', source: 'Naukri', status: 'Yet To Join', assignedRecruiter: recruiter5._id, assignedRecruiterName: recruiter5.name },
    { name: 'Ritu Sharma', email: 'ritu.s@email.com', phone: '9876543221', skills: ['SAP', 'Oracle', 'ERP'], experience: '7 years', currentCTC: '15 LPA', expectedCTC: '22 LPA', noticePeriod: '60 days', location: 'Mumbai', city: 'Mumbai', localArea: 'Lower Parel', source: 'Referral', status: 'Eligible Candidates', assignedRecruiter: recruiter1._id, assignedRecruiterName: recruiter1.name },
    { name: 'Akash Jain', email: 'akash.j@email.com', phone: '9876543222', skills: ['PHP', 'Laravel', 'MySQL'], experience: '2 years', currentCTC: '4 LPA', expectedCTC: '6 LPA', noticePeriod: '30 days', location: 'Jaipur', city: 'Jaipur', localArea: 'Malviya Nagar', source: 'Indeed', status: 'Did Not Pick', assignedRecruiter: recruiter2._id, assignedRecruiterName: recruiter2.name },
    { name: 'Nisha Verma', email: 'nisha.v@email.com', phone: '9876543223', skills: ['Angular', 'TypeScript', 'RxJS'], experience: '4 years', currentCTC: '7 LPA', expectedCTC: '11 LPA', noticePeriod: '30 days', location: 'Hyderabad', city: 'Hyderabad', localArea: 'Gachibowli', source: 'LinkedIn', status: 'Operations Round', assignedRecruiter: recruiter3._id, assignedRecruiterName: recruiter3.name },
    { name: 'Sunil Patil', email: 'sunil.p@email.com', phone: '9876543224', skills: ['Networking', 'Linux', 'AWS'], experience: '5 years', currentCTC: '8 LPA', expectedCTC: '12 LPA', noticePeriod: '45 days', location: 'Chennai', city: 'Chennai', localArea: 'Velachery', source: 'Naukri', status: 'Written Test', assignedRecruiter: recruiter4._id, assignedRecruiterName: recruiter4.name },
    { name: 'Anjali Das', email: 'anjali.d@email.com', phone: '9876543225', skills: ['Testing', 'Selenium', 'Automation'], experience: '3 years', currentCTC: '5 LPA', expectedCTC: '8 LPA', noticePeriod: '30 days', location: 'Bangalore', city: 'Bangalore', localArea: 'Electronic City', source: 'Monster', status: 'Rejected', assignedRecruiter: recruiter5._id, assignedRecruiterName: recruiter5.name },
    { name: 'Gaurav Mishra', email: 'gaurav.m@email.com', phone: '9876543226', skills: ['React Native', 'Flutter', 'Mobile Dev'], experience: '3 years', currentCTC: '7 LPA', expectedCTC: '10 LPA', noticePeriod: '30 days', location: 'Mumbai', city: 'Mumbai', localArea: 'Powai', source: 'Social Media', status: 'Joined', assignedRecruiter: recruiter1._id, assignedRecruiterName: recruiter1.name },
    { name: 'Tanvi Shah', email: 'tanvi.s@email.com', phone: '9876543227', skills: ['Recruitment', 'HR Operations', 'Payroll'], experience: '2 years', currentCTC: '3 LPA', expectedCTC: '4.5 LPA', noticePeriod: '15 days', location: 'Pune', city: 'Pune', localArea: 'Wakad', source: 'Walk-In', status: 'Interested', assignedRecruiter: recruiter2._id, assignedRecruiterName: recruiter2.name, isWalkIn: true },
  ];

  // Add notes and flag some
  candidateData[2].flagged = true;
  candidateData[2].flagReason = 'Phone number may be incorrect';
  candidateData[12].flagged = true;
  candidateData[12].flagReason = 'Skills mismatch with resume';
  candidateData[14].flagged = true;
  candidateData[14].flagReason = 'Duplicate entry suspected';

  candidateData[0].notes = [
    { text: 'Very interested in the position. Good communication.', addedBy: recruiter1._id, addedByName: recruiter1.name, followUpDate: new Date(Date.now() + 86400000) },
    { text: 'Sent JD via email.', addedBy: recruiter1._id, addedByName: recruiter1.name },
  ];
  candidateData[1].notes = [
    { text: 'Interview scheduled for next week.', addedBy: recruiter1._id, addedByName: recruiter1.name, followUpDate: new Date(Date.now() + 172800000) },
  ];

  const candidates = await Candidate.create(candidateData);
  console.log(`Created ${candidates.length} candidates`);

  // ── Jobs ──
  const Job = require('../models/Job');
  await Job.deleteMany({});
  const jobs = await Job.create([
    { companyName: 'TCS', jrNumber: 'JR-2026-001', jobTitle: 'React Developer', department: 'IT', jobType: 'Full Time', experience: '2-4 years', location: 'Mumbai', positions: 3, skills: ['React', 'TypeScript', 'Node.js'], description: 'Looking for experienced React developers for enterprise app development.', requirements: 'Strong knowledge of React hooks, Redux, REST APIs.', status: 'Open', createdBy: users[5]._id },
    { companyName: 'Infosys', jrNumber: 'JR-2026-002', jobTitle: 'Python Backend Engineer', department: 'Engineering', jobType: 'Full Time', experience: '3-5 years', location: 'Bangalore', positions: 2, skills: ['Python', 'Django', 'AWS', 'PostgreSQL'], description: 'Backend engineer to build scalable microservices.', requirements: 'Proficiency in Python, Django/Flask, AWS services.', status: 'Open', createdBy: users[5]._id },
    { companyName: 'Wipro', jrNumber: 'JR-2026-003', jobTitle: 'HR Executive', department: 'Human Resources', jobType: 'Full Time', experience: '1-3 years', location: 'Pune', positions: 1, skills: ['Recruitment', 'Sourcing', 'HR Operations'], description: 'HR executive to manage end-to-end recruitment cycle.', requirements: 'Experience in recruitment, sourcing, and HRIS tools.', status: 'Open', createdBy: users[7]._id },
    { companyName: 'HCL', jrNumber: 'JR-2026-004', jobTitle: 'DevOps Engineer', department: 'Infrastructure', jobType: 'Full Time', experience: '4-6 years', location: 'Noida', positions: 2, skills: ['Docker', 'Kubernetes', 'Jenkins', 'AWS'], description: 'DevOps engineer for CI/CD pipeline management.', requirements: 'Hands-on with Docker, K8s, Terraform, and CI/CD tools.', status: 'Open', createdBy: users[7]._id },
    { companyName: 'Tech Mahindra', jrNumber: 'JR-2026-005', jobTitle: 'Customer Support Executive', department: 'BPO', jobType: 'Full Time', experience: '0-2 years', location: 'Chennai', positions: 10, skills: ['English', 'Customer Service', 'Communication'], description: 'Support executives for international voice process.', requirements: 'Good English communication, willingness to work in shifts.', status: 'Open', createdBy: users[5]._id },
    { companyName: 'Accenture', jrNumber: 'JR-2026-006', jobTitle: 'UI/UX Designer', department: 'Design', jobType: 'Contract', experience: '2-4 years', location: 'Hyderabad', positions: 1, skills: ['Figma', 'Photoshop', 'UI/UX', 'Prototyping'], description: 'Designer for enterprise dashboard and mobile apps.', requirements: 'Portfolio required. Proficiency in Figma and design systems.', status: 'Closed', createdBy: users[7]._id },
  ]);
  console.log(`Created ${jobs.length} jobs`);

  // ── Call Logs ──
  const callLogData = [];
  const outcomes = ['Interested', 'Not Interested', 'Call Back', 'No Answer', 'Busy', 'Wrong Number'];
  for (let i = 0; i < 40; i++) {
    const cand = candidates[i % candidates.length];
    const rec = users[i % 5];
    callLogData.push({
      candidate: cand._id,
      candidateName: cand.name,
      candidatePhone: cand.phone,
      recruiter: rec._id,
      recruiterName: rec.name,
      startTime: new Date(Date.now() - Math.random() * 7 * 86400000),
      endTime: new Date(Date.now() - Math.random() * 7 * 86400000 + 300000),
      duration: Math.floor(Math.random() * 600) + 30,
      outcome: outcomes[Math.floor(Math.random() * outcomes.length)],
      notes: 'Follow-up call regarding position',
      completed: true,
    });
  }
  await CallLog.create(callLogData);
  console.log(`Created ${callLogData.length} call logs`);

  // ── Interviews ──
  const interviewData = [];
  const modes = ['In-Person', 'Video', 'Telephonic'];
  const statuses = ['Scheduled', 'Completed', 'Cancelled', 'No Show'];
  for (let i = 0; i < 10; i++) {
    const cand = candidates[i];
    const rec = users[i % 5];
    interviewData.push({
      candidate: cand._id,
      candidateName: cand.name,
      role: 'Software Engineer',
      recruiter: rec._id,
      recruiterName: rec.name,
      date: new Date(Date.now() + (i - 3) * 86400000),
      time: `${10 + (i % 8)}:00`,
      mode: modes[i % 3],
      status: statuses[i % 4],
      round: `Round ${(i % 3) + 1}`,
      location: i % 3 === 0 ? 'White Horse Office, Mumbai' : '',
      notes: 'Technical interview',
    });
  }
  await Interview.create(interviewData);
  console.log(`Created ${interviewData.length} interviews`);

  // ── Walk-Ins ──
  const walkInData = [];
  const walkInStatuses = ['Waiting', 'In Review', 'Interviewed', 'Selected', 'Rejected'];
  for (let i = 0; i < 8; i++) {
    walkInData.push({
      referenceId: `WHM/WI/26/0000${i + 1}`,
      token: `WI-${1001 + i}`,
      name: candidateData[i].name,
      phone: candidateData[i].phone,
      experience: candidateData[i].experience,
      resumeUploaded: i % 2 === 0,
      status: walkInStatuses[i % 5],
      assignedTo: i < 5 ? users[i % 5]._id : undefined,
      assignedToName: i < 5 ? users[i % 5].name : undefined,
      candidate: candidates[i]._id,
      registeredAt: new Date(),
    });
  }
  await WalkIn.create(walkInData);
  console.log(`Created ${walkInData.length} walk-in entries`);

  // ── Attendance (last 7 days) ──
  const attendanceData = [];
  for (let day = 0; day < 7; day++) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    date.setHours(0, 0, 0, 0);

    for (const user of users) {
      const isPresent = Math.random() > 0.15;
      if (isPresent) {
        const loginHour = 9 + Math.floor(Math.random() * 2);
        const loginTime = new Date(date);
        loginTime.setHours(loginHour, Math.floor(Math.random() * 30), 0);

        const logoutTime = new Date(date);
        logoutTime.setHours(loginHour + 8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0);

        attendanceData.push({
          user: user._id,
          name: user.name,
          role: user.role,
          date,
          loginTime,
          logoutTime: day > 0 ? logoutTime : undefined,
          isWFH: user.isWFH,
          status: user.isWFH ? 'WFH' : 'Present',
          totalHours: day > 0 ? Math.round(((logoutTime - loginTime) / 3600000) * 100) / 100 : 0,
        });
      }
    }
  }
  await Attendance.create(attendanceData);
  console.log(`Created ${attendanceData.length} attendance records`);

  // ── Holidays ──
  const holidays2026 = [
    { date: new Date(2026, 0, 26), name: 'Republic Day', type: 'National', year: 2026 },
    { date: new Date(2026, 2, 10), name: 'Holi', type: 'Festival', year: 2026 },
    { date: new Date(2026, 3, 6), name: 'Ram Navami', type: 'Festival', year: 2026 },
    { date: new Date(2026, 3, 14), name: 'Ambedkar Jayanti', type: 'National', year: 2026 },
    { date: new Date(2026, 4, 1), name: 'May Day', type: 'National', year: 2026 },
    { date: new Date(2026, 7, 15), name: 'Independence Day', type: 'National', year: 2026 },
    { date: new Date(2026, 9, 2), name: 'Gandhi Jayanti', type: 'National', year: 2026 },
    { date: new Date(2026, 9, 20), name: 'Dussehra', type: 'Festival', year: 2026 },
    { date: new Date(2026, 10, 9), name: 'Diwali', type: 'Festival', year: 2026 },
    { date: new Date(2026, 11, 25), name: 'Christmas', type: 'Optional', year: 2026 },
  ];
  await Holiday.create(holidays2026);
  console.log(`Created ${holidays2026.length} holidays`);

  // ── Permissions ──
  await Permission.create([
    { role: 'recruiter', permissions: { view_resumes: true, add_resumes: true, edit_resumes: true, delete_resumes: false, make_calls: true, view_call_history: true, walkin_register: true, view_reports: false, export_reports: false, manage_team: false, correction: false, view_salary: false, view_revenue: false, manage_users: false, access_control: false, view_logs: false, manage_attendance: false } },
    { role: 'tl', permissions: { view_resumes: true, add_resumes: true, edit_resumes: true, delete_resumes: false, make_calls: true, view_call_history: true, walkin_register: true, view_reports: true, export_reports: false, manage_team: true, correction: true, view_salary: false, view_revenue: false, manage_users: false, access_control: false, view_logs: false, manage_attendance: false } },
    { role: 'manager', permissions: { view_resumes: true, add_resumes: false, edit_resumes: false, delete_resumes: false, make_calls: false, view_call_history: true, walkin_register: false, view_reports: true, export_reports: true, manage_team: true, correction: false, view_salary: true, view_revenue: true, manage_users: false, access_control: false, view_logs: false, manage_attendance: false } },
    { role: 'admin', permissions: { view_resumes: true, add_resumes: true, edit_resumes: true, delete_resumes: true, make_calls: true, view_call_history: true, walkin_register: true, view_reports: true, export_reports: true, manage_team: true, correction: true, view_salary: true, view_revenue: true, manage_users: true, access_control: true, view_logs: true, manage_attendance: true } },
  ]);
  console.log('Created permissions');

  // ── Audit Logs ──
  const logTypes = ['call', 'status', 'login', 'edit', 'create', 'system'];
  const logData = [];
  for (let i = 0; i < 30; i++) {
    const u = users[i % users.length];
    logData.push({
      type: logTypes[i % logTypes.length],
      user: u._id,
      userName: u.name,
      role: u.role,
      action: [
        'User logged in',
        'Called candidate Arjun Mehta',
        'Status changed: New → Contacted',
        'Added candidate Sneha Gupta',
        'Updated candidate profile',
        'System health check',
        'Exported reports',
        'Created new user',
        'Modified permissions',
        'Generated salary report',
      ][i % 10],
      target: candidates[i % candidates.length]?._id?.toString() || '',
      ip: '192.168.1.' + (10 + i),
      timestamp: new Date(Date.now() - i * 3600000),
    });
  }
  await AuditLog.create(logData);
  console.log(`Created ${logData.length} audit logs`);

  // ── Invoices ──
  const invoiceStatuses = ['Paid', 'Pending', 'Overdue', 'Due Soon'];
  const invoiceData = [];
  const clients = ['TCS', 'Infosys', 'Wipro', 'HCL', 'Tech Mahindra', 'Accenture', 'IBM', 'Cognizant'];
  for (let i = 0; i < 8; i++) {
    invoiceData.push({
      client: clients[i],
      amount: 50000 + Math.floor(Math.random() * 200000),
      dueDate: new Date(Date.now() + (i - 3) * 7 * 86400000),
      status: invoiceStatuses[i % 4],
      description: `Placement fee for ${candidates[i]?.name || 'candidate'}`,
      candidateRef: candidates[i]?._id,
      recruiterRef: users[i % 5]._id,
    });
  }
  await Invoice.create(invoiceData);
  console.log(`Created ${invoiceData.length} invoices`);

  console.log('\n✅ Database seeded successfully!');
  console.log('\nTest Accounts:');
  console.log('──────────────────────────────────');
  console.log('Recruiter: EMP001 / password123');
  console.log('Recruiter (WFH): EMP002 / password123');
  console.log('Team Lead: EMP006 / password123');
  console.log('Manager: EMP007 / password123');
  console.log('Admin: EMP008 / password123');
  console.log('──────────────────────────────────');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
