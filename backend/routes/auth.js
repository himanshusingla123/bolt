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
        // Completely disable email confirmation for development
        emailRedirectTo: null,
        data: {
          email_confirm: false
        }
      }
    });
    
    if (error) {
      console.error('Registration error:', error);
      throw error;
    }
    
    console.log('Registration successful:', data);
    
    // For development, we'll manually confirm the email
    if (data.user && !data.user.email_confirmed_at) {
      console.log('Manually confirming email for development...');
      try {
        await supabase.auth.admin.updateUserById(data.user.id, {
          email_confirm: true
        });
        console.log('Email confirmed manually');
      } catch (confirmError) {
        console.error('Failed to confirm email manually:', confirmError);
      }
    }
    
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
    // First, let's check if the user exists and their confirmation status
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    const user = userData?.users?.find(u => u.email === email);
    
    if (user) {
      console.log('User found:', user.email, 'Email confirmed:', user.email_confirmed_at);
      
      // If user exists but email not confirmed, confirm it manually for development
      if (!user.email_confirmed_at) {
        console.log('Confirming email manually for login...');
        try {
          await supabase.auth.admin.updateUserById(user.id, {
            email_confirm: true
          });
          console.log('Email confirmed manually for login');
        } catch (confirmError) {
          console.error('Failed to confirm email for login:', confirmError);
        }
      }
    } else {
      console.log('User not found in database');
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      console.error('Login error:', error);
      
      // If it's an email not confirmed error, try to handle it
      if (error.message.includes('email not confirmed') || error.message.includes('Email not confirmed')) {
        console.log('Attempting to resolve email confirmation issue...');
        
        // Try to find and confirm the user
        if (user) {
          try {
            await supabase.auth.admin.updateUserById(user.id, {
              email_confirm: true
            });
            console.log('Email confirmed, retrying login...');
            
            // Retry login
            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({ email, password });
            if (retryError) {
              throw retryError;
            }
            
            return res.status(200).json({
              access_token: retryData.session?.access_token,
              refresh_token: retryData.session?.refresh_token,
              user: retryData.user
            });
          } catch (retryConfirmError) {
            console.error('Failed to confirm and retry:', retryConfirmError);
          }
        }
      }
      
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