require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

const UPLOAD_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.random().toString(36).substr(2, 9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        cb(null, allowed.includes(file.mimetype));
    }
});

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:80',
    'http://localhost',
    'http://frontend:80',
    'http://backend:3000'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(path.join(__dirname, '..')));

function generateToken(user, role) {
    return jwt.sign(
        { id: user.id, email: user.email, name: user.name, role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

function setTokenCookie(res, token) {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
}

function clearTokenCookie(res) {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });
}

async function authenticateToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
}

app.post('/api/auth/register/user', async (req, res) => {
    try {
        const { name, email, mobile, password, confirmPassword } = req.body;

        if (!name || !email || !mobile || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                mobile,
                password: hashedPassword,
                role: 'USER'
            }
        });

        const token = generateToken(user, 'USER');
        setTokenCookie(res, token);

        res.status(201).json({
            success: true,
            user: { id: user.id, name: user.name, email: user.email, mobile: user.mobile, role: user.role }
        });
    } catch (err) {
        console.error('User registration error:', err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/register/admin', async (req, res) => {
    try {
        const { name, email, mobile, password, confirmPassword } = req.body;

        if (!name || !email || !mobile || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const existingAdmin = await prisma.admin.findUnique({ where: { email } });
        if (existingAdmin) {
            return res.status(400).json({ error: 'Email already registered as admin' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await prisma.admin.create({
            data: {
                name,
                email,
                mobile,
                password: hashedPassword
            }
        });

        const token = generateToken(admin, 'ADMIN');
        setTokenCookie(res, token);

        res.status(201).json({
            success: true,
            user: { id: admin.id, name: admin.name, email: admin.email, mobile: admin.mobile, role: 'ADMIN' }
        });
    } catch (err) {
        console.error('Admin registration error:', err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login/user', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = generateToken(user, 'USER');
        setTokenCookie(res, token);

        res.json({
            success: true,
            user: { id: user.id, name: user.name, email: user.email, mobile: user.mobile, role: user.role }
        });
    } catch (err) {
        console.error('User login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/auth/login/admin', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const admin = await prisma.admin.findUnique({ where: { email } });
        if (!admin) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const validPassword = await bcrypt.compare(password, admin.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = generateToken(admin, 'ADMIN');
        setTokenCookie(res, token);

        res.json({
            success: true,
            user: { id: admin.id, name: admin.name, email: admin.email, mobile: admin.mobile, role: 'ADMIN' }
        });
    } catch (err) {
        console.error('Admin login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    clearTokenCookie(res);
    res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        let user;
        if (req.user.role === 'ADMIN') {
            user = await prisma.admin.findUnique({
                where: { id: req.user.id },
                select: { id: true, name: true, email: true, mobile: true, createdAt: true }
            });
        } else {
            user = await prisma.user.findUnique({
                where: { id: req.user.id },
                select: { id: true, name: true, email: true, mobile: true, role: true, createdAt: true }
            });
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: { ...user, role: req.user.role } });
    } catch (err) {
        console.error('Get me error:', err);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

app.post('/api/reports', upload.single('photo'), authenticateToken, requireRole('USER', 'ADMIN'), async (req, res) => {
    try {
        const { problemType, otherType, priority, description } = req.body;

        if (!problemType || !description || !priority) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const report = await prisma.report.create({
            data: {
                problemType,
                otherType: otherType || null,
                priority,
                description,
                status: 'Submitted',
                photo: req.file ? `/uploads/${req.file.filename}` : null,
                userId: req.user.role === 'USER' ? req.user.id : null
            }
        });

        res.json({ success: true, report });
    } catch (err) {
        console.error('Error saving report:', err);
        res.status(500).json({ error: 'Failed to save report' });
    }
});

app.get('/api/reports', async (req, res) => {
    try {
        const { status } = req.query;
        const where = status && status !== 'all' ? { status } : {};

        const reports = await prisma.report.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        res.json(reports);
    } catch (err) {
        console.error('Error fetching reports:', err);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

app.get('/api/reports/:id', async (req, res) => {
    try {
        const report = await prisma.report.findUnique({
            where: { id: req.params.id },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        res.json(report);
    } catch (err) {
        console.error('Error fetching report:', err);
        res.status(500).json({ error: 'Failed to fetch report' });
    }
});

app.patch('/api/reports/:id/status', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const { status } = req.body;
        const report = await prisma.report.update({
            where: { id: req.params.id },
            data: { status }
        });
        res.json({ success: true, report });
    } catch (err) {
        console.error('Error updating report:', err);
        res.status(500).json({ error: 'Failed to update report' });
    }
});

app.delete('/api/reports/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        await prisma.report.delete({
            where: { id: req.params.id }
        });
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting report:', err);
        res.status(500).json({ error: 'Failed to delete report' });
    }
});

app.get('/api/admin/stats', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const [total, submitted, inProgress, resolved] = await Promise.all([
            prisma.report.count(),
            prisma.report.count({ where: { status: 'Submitted' } }),
            prisma.report.count({ where: { status: 'In Progress' } }),
            prisma.report.count({ where: { status: 'Resolved' } })
        ]);

        res.json({ total, submitted, inProgress, resolved });
    } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Upload folder: ${UPLOAD_DIR}`);
});

process.on('beforeExit', async () => {
    await prisma.$disconnect();
});