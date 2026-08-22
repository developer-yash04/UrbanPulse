const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    const hashedPassword = await bcrypt.hash('password123', 10);

    const user = await prisma.user.upsert({
        where: { email: 'user@example.com' },
        update: {},
        create: {
            name: 'Test User',
            email: 'user@example.com',
            mobile: '9876543210',
            password: hashedPassword,
            role: 'USER'
        }
    });

    const admin = await prisma.admin.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            name: 'Test Admin',
            email: 'admin@example.com',
            mobile: '9876543211',
            password: hashedPassword
        }
    });

    console.log('Created user:', user.email);
    console.log('Created admin:', admin.email);

    const reports = [
        {
            problemType: 'Pothole',
            priority: 'High',
            description: 'Large pothole on Main Street near the intersection with Oak Ave. Causing damage to vehicles.',
            status: 'Submitted',
            photo: null,
            userId: user.id
        },
        {
            problemType: 'Garbage',
            priority: 'Medium',
            description: 'Overflowing garbage bins at the community park. Trash is scattered around the area.',
            status: 'In Progress',
            photo: null,
            userId: user.id
        },
        {
            problemType: 'Drainage',
            priority: 'High',
            description: 'Blocked storm drain causing flooding during rain on Elm Street.',
            status: 'Resolved',
            photo: null,
            userId: user.id
        },
        {
            problemType: 'Broken Streetlight',
            priority: 'Low',
            description: 'Streetlight not working at the corner of Pine St and 5th Ave. Area is very dark at night.',
            status: 'Submitted',
            photo: null,
            userId: user.id
        },
        {
            problemType: 'Road Damage',
            priority: 'Medium',
            description: 'Cracked pavement on Highway 101 near exit 12. Getting worse with heavy traffic.',
            status: 'In Progress',
            photo: null,
            userId: user.id
        },
        {
            problemType: 'Water Leakage',
            priority: 'High',
            description: 'Water main break on Cedar Road. Water flowing onto street and sidewalk.',
            status: 'Submitted',
            photo: null,
            userId: user.id
        },
        {
            problemType: 'Other',
            otherType: 'Noise Complaint',
            priority: 'Low',
            description: 'Construction noise starting before 7 AM on weekdays near residential area.',
            status: 'Resolved',
            photo: null,
            userId: user.id
        }
    ];

    for (const report of reports) {
        await prisma.report.create({
            data: report
        });
    }

    console.log('Database seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });