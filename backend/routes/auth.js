const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');

// Register endpoint
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  
  console.log('Registration attempt for:', email);
  
  try {
    // Use simple signup without email confirmation
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password
    });
    
    if (error) {
      console.error('Registration error:', error);
      throw error;
    }
    
    console.log('Registration successful for:', email);
    
    // Return success response
    res.status(201).json({
      id: data.user?.id,
      email: data.user?.email,
      created_at: data.user?.created_at,
      message: 'Registration successful'
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
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
    
    if (error) {
      console.error('Login error:', error);
      
      // Handle specific error cases
      if (error.message.includes('Invalid login credentials')) {
        return res.status(400).json({ error: 'Invalid email or password' });
      }
      
      if (error.message.includes('Email not confirmed')) {
        // Try to confirm the user using admin client
        console.log('Attempting to confirm email for:', email);
        try {
          // First get the user
          const { data: users } = await supabaseAdmin.auth.admin.listUsers();
          const user = users.users.find(u => u.email === email);
          
          if (user && !user.email_confirmed_at) {
            // Confirm the user
            await supabaseAdmin.auth.admin.updateUserById(user.id, {
              email_confirm: true
            });
            
            console.log('Email confirmed, retrying login...');
            
            // Retry login
            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({ 
              email, 
              password 
            });
            
            if (retryError) {
              throw retryError;
            }
            
            return res.status(200).json({
              access_token: retryData.session?.access_token,
              refresh_token: retryData.session?.refresh_token,
              user: retryData.user
            });
          }
        } catch (confirmError) {
          console.error('Failed to confirm email:', confirmError);
        }
        
        return res.status(400).json({ 
          error: 'Please check your email and confirm your account before logging in' 
        });
      }
      
      throw error;
    }
    
    if (!data.session) {
      throw new Error('No session created');
    }
    
    console.log('Login successful for:', email);
    
    res.status(200).json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: data.user
    });
    
  } catch (error) {
    console.error('Login failed:', error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;