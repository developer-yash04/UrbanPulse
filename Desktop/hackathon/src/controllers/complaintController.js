const supabase = require('../lib/supabase');

// Submit complaint (Handles photo upload to Supabase Storage)
const createComplaint = async (req, res) => {
  try {
    const { user_id, description, category, priority, latitude, longitude } = req.body;
    let imageUrl = null;

    if (req.file) {
      const fileName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;
      const { error: uploadError } = await supabase.storage
        .from('complaint-images')
        .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('complaint-images').getPublicUrl(fileName);
      imageUrl = publicUrlData.publicUrl;
    }

    const { data, error } = await supabase
      .from('complaints')
      .insert([{
        user_id: user_id || 'anonymous',
        description,
        category,
        priority: priority || 'Medium',
        status: 'Submitted',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        image_url: imageUrl,
        upvotes: 0
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Fetch complaints (For Admin Dashboard & Map)
const getComplaints = async (req, res) => {
  try {
    const { category, priority, status } = req.query;
    
    let query = supabase.from('complaints').select('*')
      .order('upvotes', { ascending: false })
      .order('created_at', { ascending: false });

    if (category) query = query.eq('category', category);
    if (priority) query = query.eq('priority', priority);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Upvote existing complaint (Duplicate reporting alternative)
const upvoteComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Get current count
    const { data: current, error: fetchErr } = await supabase
      .from('complaints').select('upvotes').eq('id', id).single();
    if (fetchErr) throw fetchErr;

    // 2. Increment
    const { data, error } = await supabase
      .from('complaints')
      .update({ upvotes: current.upvotes + 1 })
      .eq('id', id)
      .select().single();
      
    if (error) throw error;
    res.status(200).json({ success: true, upvotes: data.upvotes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Change status (Authority updates: Submitted -> Under Review -> Resolved)
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from('complaints').update({ status }).eq('id', id).select().single();
      
    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createComplaint, getComplaints, upvoteComplaint, updateStatus };