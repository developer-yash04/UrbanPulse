# UrbanPulse Backend

## Setup Instructions

### 1. Install MySQL
Make sure MySQL is installed and running on your system.

### 2. Configure Database
Edit `backend/.env` with your MySQL credentials:
```env
DATABASE_URL="mysql://username:password@localhost:3306/urbanpulse"
PORT=3000
NODE_ENV=development
```

### 3. Create Database
```bash
mysql -u root -p
CREATE DATABASE urbanpulse;
EXIT;
```

### 4. Install Dependencies
```bash
cd backend
npm install
```

### 5. Generate Prisma Client
```bash
npx prisma generate
```

### 6. Push Schema to Database
```bash
npx prisma db push
```

### 7. Seed Database (Optional)
```bash
node prisma/seed.js
```

### 8. Start Server
```bash
npm start
# or for development
npm run dev
```

Server will run at `http://localhost:3000`


