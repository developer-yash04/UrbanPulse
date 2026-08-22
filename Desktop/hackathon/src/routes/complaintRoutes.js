const express = require('express');
const multer = require('multer');
const router = express.Router();
const { createComplaint, getComplaints, upvoteComplaint, updateStatus } = require('../controllers/complaintController');

// Store file in memory to directly upload to Supabase Storage
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('photo'), createComplaint);
router.get('/', getComplaints);
router.patch('/:id/upvote', upvoteComplaint);
router.patch('/:id/status', updateStatus);

module.exports = router;