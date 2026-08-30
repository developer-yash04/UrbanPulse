# UrbanPulse Backend

## Setup Instructions

### 1. Install MySQL
Make sure MySQL is installed and running on your system.


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


