require('dotenv').config();
const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');
const axios = require('axios');

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY
});
async function listAgents(options = {}) {
  try {
    const { cursor = null, pageSize = 30, search = null } = options;
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    if (pageSize) params.append('page_size', pageSize);
    if (search) params.append('search', search);

    const response = await axios.get('https://api.elevenlabs.io/v1/convai/agents', {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      params
    });
    return response.data;
  } catch (error) {
    console.error('Error listing agents:', error);
    throw error;
  }
}

async function getAgent(agentId) {
  try {
    const response = await axios.get(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error getting agent ${agentId}:`, error);
    throw error;
  }
}

async function deleteAgent(agentId) {
  try {
    const response = await axios.delete(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error deleting agent ${agentId}:`, error);
    throw error;
  }
}

async function getSignedUrl(agentId) {
  try {
    const response = await axios.get('https://api.elevenlabs.io/v1/convai/conversation/get-signed-url', {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      params: {
        agent_id: agentId
      }
    });
    return response.data.signed_url;
  } catch (error) {
    console.error(`Error getting signed URL for agent ${agentId}:`, error);
    throw error;
  }
}

async function getWidgetConfig(agentId) {
  try {
    const response = await axios.get(`https://api.elevenlabs.io/v1/convai/agents/${agentId}/widget`, {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error getting widget config for agent ${agentId}:`, error);
    throw error;
  }
}

async function uploadAgentAvatar(agentId, avatarFile) {
  try {
    const formData = new FormData();
    formData.append('avatar_file', avatarFile);

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/convai/agents/${agentId}/avatar`,
      formData,
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error uploading avatar for agent ${agentId}:`, error);
    throw error;
  }
}

module.exports = {
  elevenlabs,
  listAgents,
  getAgent,
  deleteAgent,
  getSignedUrl,
  getWidgetConfig,
  uploadAgentAvatar
};