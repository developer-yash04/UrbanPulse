const supabase = require('../lib/supabase'); // Ensure this points to your Supabase connection file

const createComplaint = async (req, res) => {
  try {
    // 1. Grab text data sent by the frontend
    const { user_id, description, category, priority, latitude, longitude } = req.body;
    
    let imageUrl = null;

    // 2. Handle the Image (Multer intercepted this for us!)
    if (req.file) {
      const fileName = `${Date.now()}-${req.file.originalname}`;
      
      // Upload raw buffer to Supabase Storage bucket named 'complaints'
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('complaints') 
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
        });

      if (uploadError) throw uploadError;

      // Get the public URL to save in the database
      const { data: publicUrlData } = supabase.storage
        .from('complaints')
        .getPublicUrl(fileName);
        
      imageUrl = publicUrlData.publicUrl;
    }

    // 3. Insert all data into your 'complaints' SQL table
    const { data, error } = await supabase
      .from('complaints')
      .insert([
        {
          user_id: user_id || '00000000-0000-0000-0000-000000000000',
          description,
          category,
          priority,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          image_url: imageUrl,
          status: 'Submitted'
        }
      ])
      .select(); // Returns the newly created row

    if (error) throw error;

    // 4. Send success response back to frontend
    res.status(201).json({ success: true, data: data[0] });

  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({ success: false, message: 'Failed to submit complaint' });
  }
};

const getComplaints = async (req, res) => {
  try {
    // Fetch all complaints from Supabase, newest first
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Send the array of data back to the frontend
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch complaints' });
  }
};

module.exports = { createComplaint, getComplaints };