const Candidate = require('../models/Candidate');
const CallLog = require('../models/CallLog');
const Interview = require('../models/Interview');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const AuditLog = require('../models/AuditLog');
const WalkIn = require('../models/WalkIn');
const TeamMember = require('../models/TeamMember');
const { getDateRange } = require('../utils/helpers');

// GET /api/dashboard/recruiter
exports.recruiterDashboard = async (req, res, next) => {
  try {
    const { dateRange = 'month', startDate, endDate } = req.query;
    const { start, end } = getDateRange(dateRange, startDate, endDate);
    const userId = req.user._id;
    const isAdmin = ['admin', 'manager'].includes(req.user.role);

    const dateFilter = { $gte: start, $lt: end };
    const baseMatch = isAdmin
      ? { createdAt: dateFilter }
      : { assignedRecruiter: userId, createdAt: dateFilter };

    // Pipeline counts
    const statusCounts = await Candidate.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const pipeline = {};
    Candidate.STATUSES.forEach(s => { pipeline[s] = 0; });
    statusCounts.forEach(s => { pipeline[s._id] = s.count; });

    // Call stats
    const totalCalls = await CallLog.countDocuments({ recruiter: userId, createdAt: dateFilter });
    const todayCalls = await CallLog.countDocuments({
      recruiter: userId,
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    });

    // Interview stats
    const totalInterviews = await Interview.countDocuments({ recruiter: userId, createdAt: dateFilter });
    const scheduledInterviews = await Interview.countDocuments({ recruiter: userId, status: 'Scheduled' });

    // Candidates
    const totalCandidates = await Candidate.countDocuments(baseMatch);
    const joined = await Candidate.countDocuments({ ...baseMatch, status: 'Joined' });

    // Follow-ups (candidates with follow-up notes)
    const followUps = await Candidate.find({
      ...(!isAdmin && { assignedRecruiter: userId }),
      'notes.followUpDate': { $gte: new Date(new Date().setHours(0, 0, 0, 0)), $lt: new Date(new Date().setHours(23, 59, 59, 999)) },
    }).select('name phone status notes').limit(10);

    // Recent activity
    const recentActivity = await AuditLog.find({ user: userId })
      .sort('-timestamp').limit(10)
      .select('action timestamp type');

    // Call target (daily = 50)
    const callTarget = { target: 50, completed: todayCalls };

    res.json({
      metrics: {
        totalCandidates,
        totalCalls,
        todayCalls,
        totalInterviews,
        scheduledInterviews,
        joined,
        conversionRate: totalCandidates > 0 ? Math.round((joined / totalCandidates) * 100) : 0,
      },
      pipeline,
      followUps,
      recentActivity,
      callTarget,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/tl
exports.tlDashboard = async (req, res, next) => {
  try {
    const { tlId } = req.query;
    const currentUser = req.user;

    // Determine target TL ID: Admins can specify, TLs get their own
    const targetTlId = (currentUser.role === 'admin' || currentUser.role === 'manager') && tlId ? tlId : currentUser._id;

    // Get assigned team members (recruiters)
    const teamAssignments = await TeamMember.find({ teamLeaderId: targetTlId })
      .populate('memberId', 'name email employeeId status')
      .lean();
    
    const recruiters = teamAssignments
      .map(ta => ta.memberId)
      .filter(u => u && u.status === 'Active');

    const recruiterIds = recruiters.map(r => r._id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const teamStats = await Promise.all(recruiters.map(async (r) => {
      // Count notes added today as "calls made" (each note = a recruiter interaction)
      const callsAgg = await Candidate.aggregate([
        { $match: { assignedRecruiter: r._id } },
        { $unwind: '$notes' },
        { $match: { 'notes.createdAt': { $gte: today, $lt: tomorrow } } },
        { $count: 'count' },
      ]);
      const todayCalls = callsAgg[0]?.count || 0;

      // Count candidates with interview scheduled today
      const todayInterviews = await Candidate.countDocuments({
        assignedRecruiter: r._id,
        $or: [
          { interviewScheduled: { $gte: today, $lt: tomorrow } },
          { interviewDate: { $gte: today, $lt: tomorrow } },
        ],
      });

      // Count candidates needing TL follow-up (Eligible, but no TL call submitted)
      const followUps = await Candidate.countDocuments({
        assignedRecruiter: r._id,
        firstCallStatus: 'Eligible',
        tlCallSubmitted: false,
      });

      const totalCandidates = await Candidate.countDocuments({ assignedRecruiter: r._id });
      const activeCandidates = await Candidate.countDocuments({
        assignedRecruiter: r._id,
        status: { $nin: ['Rejected', 'Joined'] },
      });

      const totalCallsAgg = await Candidate.aggregate([
        { $match: { assignedRecruiter: r._id } },
        { $unwind: '$notes' },
        { $count: 'count' },
      ]);
      const totalCalls = totalCallsAgg[0]?.count || 0;

      const totalInterviewsScheduled = await Candidate.countDocuments({
        assignedRecruiter: r._id,
        status: { $in: ['Interview Scheduled', 'Interview Rescheduled', 'Interview Completed', 'Shortlisted', 'HR Round Scheduled', 'Final Round Scheduled', 'Selected', 'Rejected'] }
      });

      return {
        id: r._id,
        name: r.name,
        email: r.email,
        employeeId: r.employeeId,
        todayCalls,
        totalCalls,
        callTarget: 50,
        todayInterviews,
        totalInterviewsScheduled,
        followUps,
        totalCandidates,
        activeCandidates,
        onTarget: todayCalls >= 50,
      };
    }));

    // Pending corrections (filtered by team members)
    const corrections = await Candidate.find({ 
      flagged: true,
      assignedRecruiter: { $in: recruiterIds }
    })
      .select('name phone email skills experience source status assignedRecruiterName flagReason')
      .limit(20);

    // Team health
    const avgCalls = teamStats.length > 0 ? Math.round(teamStats.reduce((s, t) => s + t.todayCalls, 0) / teamStats.length) : 0;
    const onTarget = teamStats.filter(t => t.onTarget).length;

    res.json({
      teamMembers: teamStats,
      corrections,
      teamHealth: {
        avgCalls,
        onTargetCount: onTarget,
        totalMembers: teamStats.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/manager
exports.managerDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const dateFilter = { $gte: monthStart, $lt: monthEnd };

    // KPIs
    const totalPlacements = await Candidate.countDocuments({ status: 'Joined', updatedAt: dateFilter });
    const totalInterviews = await Interview.countDocuments({ createdAt: dateFilter });
    const completedInterviews = await Interview.countDocuments({ status: 'Completed', updatedAt: dateFilter });
    const interviewToHire = totalInterviews > 0 ? Math.round((totalPlacements / totalInterviews) * 100) : 0;

    // Funnel data (last 6 months)
    const funnelData = [];
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const mFilter = { $gte: mStart, $lt: mEnd };
      
      const applied = await Candidate.countDocuments({ createdAt: mFilter });
      const interviewed = await Interview.countDocuments({ createdAt: mFilter });
      const selected = await Candidate.countDocuments({ status: 'Selected', updatedAt: mFilter });
      const joined = await Candidate.countDocuments({ status: 'Joined', updatedAt: mFilter });
      
      funnelData.push({
        month: mStart.toLocaleString('default', { month: 'short' }),
        applied, interviewed, selected, joined,
      });
    }

    // Recruiter productivity
    const recruiters = await User.find({ role: 'recruiter', status: 'Active' }).select('name');
    const recruiterProductivity = await Promise.all(recruiters.map(async (r) => {
      const calls = await CallLog.countDocuments({ recruiter: r._id, createdAt: dateFilter });
      const interviews = await Interview.countDocuments({ recruiter: r._id, createdAt: dateFilter });
      const placements = await Candidate.countDocuments({ assignedRecruiter: r._id, status: 'Joined', updatedAt: dateFilter });
      return { name: r.name, calls, interviews, placements };
    }));

    // Source distribution
    const sourceDistribution = await Candidate.aggregate([
      { $match: { createdAt: dateFilter } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Department distribution
    const departmentDistribution = await Candidate.aggregate([
      { $match: { createdAt: dateFilter, department: { $ne: null } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      kpis: {
        totalPlacements,
        totalInterviews,
        interviewToHireRate: interviewToHire,
        avgTimeToHire: 14, // Would need hire date tracking for real calc
      },
      funnelData,
      recruiterProductivity,
      sourceDistribution: sourceDistribution.map(s => ({ source: s._id || 'Unknown', count: s.count })),
      departmentDistribution: departmentDistribution.map(d => ({ department: d._id, count: d.count })),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/admin
exports.adminDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Active users today
    const activeLogins = await Attendance.countDocuments({ date: { $gte: today, $lt: tomorrow } });
    const totalUsers = await User.countDocuments({ status: 'Active' });
    const totalResumes = await Candidate.countDocuments();
    
    // Attendance rate
    const attendanceRate = totalUsers > 0 ? Math.round((activeLogins / totalUsers) * 100) : 0;

    // Source chart
    const sourceChart = await Candidate.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Recent alerts (from logs)
    const alerts = await AuditLog.find({ type: { $in: ['delete', 'system'] } })
      .sort('-timestamp').limit(5)
      .select('action userName type timestamp');

    // System metrics
    const todayLogs = await AuditLog.countDocuments({ timestamp: { $gte: today, $lt: tomorrow } });

    res.json({
      metrics: {
        activeLogins,
        totalUsers,
        totalResumes,
        attendanceRate,
        todayLogs,
      },
      sourceChart: sourceChart.map(s => ({ source: s._id || 'Unknown', count: s.count })),
      alerts: alerts.map(a => ({
        id: a._id,
        message: a.action,
        user: a.userName,
        type: a.type,
        severity: a.type === 'delete' ? 'high' : 'medium',
        time: a.timestamp,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/manager/reports
exports.managerReports = async (req, res, next) => {
  try {
    const { dateRange = 'month', startDate, endDate, sort = 'placements' } = req.query;
    const { start, end } = getDateRange(dateRange, startDate, endDate);
    const dateFilter = { $gte: start, $lt: end };

    const recruiters = await User.find({ role: 'recruiter', status: 'Active' }).select('name employeeId');

    const reports = await Promise.all(recruiters.map(async (r) => {
      const totalCalls = await CallLog.countDocuments({ recruiter: r._id, createdAt: dateFilter });
      const interviews = await Interview.countDocuments({ recruiter: r._id, createdAt: dateFilter });
      const placements = await Candidate.countDocuments({ assignedRecruiter: r._id, status: 'Joined', updatedAt: dateFilter });
      const candidates = await Candidate.countDocuments({ assignedRecruiter: r._id, createdAt: dateFilter });

      return {
        id: r._id,
        name: r.name,
        employeeId: r.employeeId,
        totalCalls,
        interviews,
        placements,
        candidates,
        conversionRate: candidates > 0 ? Math.round((placements / candidates) * 100) : 0,
      };
    }));

    // Sort
    reports.sort((a, b) => b[sort] - a[sort] || 0);

    res.json({ reports, dateRange });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/admin/all-teams
exports.allTeamsDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Get all active Team Leaders
    const teamLeaders = await User.find({ role: 'tl', status: 'Active' }).select('name email employeeId status').lean();

    const teams = await Promise.all(teamLeaders.map(async (tl) => {
      // 2. Get recruiters for this TL
      const teamAssignments = await TeamMember.find({ teamLeaderId: tl._id, removedAt: null })
        .populate('memberId', 'name email employeeId status')
        .lean();
      
      const recruiters = teamAssignments
        .map(ta => ta.memberId)
        .filter(u => u && u.status === 'Active');

      // 3. Calculate performance for each recruiter
      const recruiterStats = await Promise.all(recruiters.map(async (r) => {
        // Calls today
        const callsAgg = await Candidate.aggregate([
          { $match: { assignedRecruiter: r._id } },
          { $unwind: '$notes' },
          { $match: { 'notes.createdAt': { $gte: today, $lt: tomorrow } } },
          { $count: 'count' },
        ]);
        const calls = callsAgg[0]?.count || 0;

        // Interviews today
        const interviews = await Candidate.countDocuments({
          assignedRecruiter: r._id,
          $or: [
            { interviewScheduled: { $gte: today, $lt: tomorrow } },
            { interviewDate: { $gte: today, $lt: tomorrow } },
          ],
        });

        // Follow-ups (Eligible candidates waiting for TL)
        const followUps = await Candidate.countDocuments({
          assignedRecruiter: r._id,
          firstCallStatus: 'Eligible',
          tlCallSubmitted: false,
        });

        // Joined count (all time)
        const joinedCount = await Candidate.countDocuments({
          assignedRecruiter: r._id,
          status: 'Joined'
        });

        return {
          id: r._id,
          name: r.name,
          employeeId: r.employeeId,
          status: r.status,
          calls,
          target: 50,
          interviews,
          followUps,
          joinedCount,
          onTarget: calls >= 50
        };
      }));

      // 4. Aggregate TL performance
      const tlStats = {
        totalCalls: recruiterStats.reduce((s, r) => s + r.calls, 0),
        totalInterviews: recruiterStats.reduce((s, r) => s + r.interviews, 0),
        totalFollowUps: recruiterStats.reduce((s, r) => s + r.followUps, 0),
        totalJoined: recruiterStats.reduce((s, r) => s + r.joinedCount, 0),
        onTargetCount: recruiterStats.filter(r => r.onTarget).length,
        totalMembers: recruiterStats.length
      };

      return {
        tlId: tl._id,
        tlName: tl.name,
        tlEmployeeId: tl.employeeId,
        recruiters: recruiterStats,
        stats: tlStats
      };
    }));

    // 5. Overall summary
    const summary = {
      totalCalls: teams.reduce((s, t) => s + t.stats.totalCalls, 0),
      totalInterviews: teams.reduce((s, t) => s + t.stats.totalInterviews, 0),
      totalFollowUps: teams.reduce((s, t) => s + t.stats.totalFollowUps, 0),
      activeRecruiters: teams.reduce((s, t) => s + t.stats.totalMembers, 0)
    };

    res.json({
      teams,
      summary
    });
  } catch (err) {
    next(err);
  }
};
