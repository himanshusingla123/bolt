const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// Register endpoint
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: undefined // Disable email confirmation for development
      }
    });
    
    if (error) {
      console.error('Registration error:', error);
      throw error;
    }
    
    console.log('Registration successful:', data);
    
    // Return the response in the format expected by frontend
    res.status(201).json({
      id: data.user?.id,
      email: data.user?.email,
      created_at: data.user?.created_at
    });
  } catch (error) {
    console.error('Registration failed:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  console.log('Login attempt for:', email);

  try {
    // First, let's check if the user exists
    const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(email);
    
    if (userError) {
      console.error('Error checking user:', userError);
    } else {
      console.log('User found:', userData?.user?.email, 'Email confirmed:', userData?.user?.email_confirmed_at);
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      console.error('Login error:', error);
      throw error;
    }
    
    console.log('Login successful:', data.user?.email);
    
    // Return the response in the format expected by frontend
    res.status(200).json({
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      user: data.user
    });
  } catch (error) {
    console.error('Login failed:', error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;