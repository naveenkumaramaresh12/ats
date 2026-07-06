const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { createLog } = require('../utils/auditLogger');
// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { employeeId, password, isWFH: loginIsWFH } = req.body;
    if (!employeeId || !password) {
      return res.status(400).json({ message: 'Employee ID and password are required' });
    }

    const identifier = employeeId.trim();
    const user = await User.findOne({
      $or: [
        { employeeId: identifier },
        { email: identifier.toLowerCase() }
      ]
    });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (user.status === 'Suspended') {
      return res.status(403).json({ message: 'Account suspended. Contact admin.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const loginTime = new Date();
    user.lastLogin = loginTime;
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    });

    // Detect late login (after 09:30 on a working day)
    const loginHour = loginTime.getHours();
    const loginMin  = loginTime.getMinutes();
    const loginDay  = loginTime.getDay();
    const isWorkingDay = loginDay !== 0 && loginDay !== 6;
    const isLateLogin  = isWorkingDay && (loginHour > 9 || (loginHour === 9 && loginMin > 30));
    const loginHHMM    = `${String(loginHour).padStart(2,'0')}:${String(loginMin).padStart(2,'0')}`;

    await createLog({
      type: 'login', user: user._id, userName: user.name,
      role: user.role,
      action: isLateLogin ? `User logged in (Late — ${loginHHMM})` : `User logged in (${loginHHMM})`,
      target: user.employeeId,
      details: { loginTime: loginHHMM, lateLogin: isLateLogin, isWFH: loginIsWFH || false },
      ip: req.ip || req.headers['x-forwarded-for'],
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isWFH: loginIsWFH || user.isWFH || false,
        avatar: user.avatar,
        faceDescriptor: user.faceDescriptor,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
exports.logout = async (req, res, next) => {
  try {
    // Update attendance logout time
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const attendance = await Attendance.findOne({ user: req.user._id, date: today });
    let totalHours = 0;
    const logoutTime = new Date();
    if (attendance && !attendance.logoutTime) {
      attendance.logoutTime = logoutTime;
      const diff = logoutTime - attendance.loginTime;
      attendance.totalHours = Math.round((diff / 3600000) * 100) / 100;
      totalHours = attendance.totalHours;
      await attendance.save();
    }

    // Detect early logout (before 18:00 on a working day)
    const logoutHour = logoutTime.getHours();
    const logoutMin  = logoutTime.getMinutes();
    const logoutDay  = logoutTime.getDay();
    const isLogoutWorkingDay = logoutDay !== 0 && logoutDay !== 6;
    const isEarlyLogout      = isLogoutWorkingDay && logoutHour < 18;
    const logoutHHMM         = `${String(logoutHour).padStart(2,'0')}:${String(logoutMin).padStart(2,'0')}`;

    await createLog({
      type: 'logout', user: req.user._id, userName: req.user.name,
      role: req.user.role,
      action: isEarlyLogout ? `User logged out (Early — ${logoutHHMM})` : `User logged out (${logoutHHMM})`,
      target: req.user.employeeId,
      details: { logoutTime: logoutHHMM, earlyLogout: isEarlyLogout, totalHours },
      ip: req.ip,
    });

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};
