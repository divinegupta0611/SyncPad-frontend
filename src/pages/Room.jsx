import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import { LogIn, Plus } from 'lucide-react';
import '../styles/RoomCSS.css';

const API_BASE_URL = 'https://syncpad-backend.onrender.com';

const Room = () => {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [debugInfo, setDebugInfo] = useState('');
  const navigate = useNavigate();

  const testConnection = async () => {
    try {
      console.log('Testing API connection...');
      const response = await axios.get(`${API_BASE_URL}/api/test`, {
        timeout: 5000
      });
      console.log('API test successful:', response.data);
      setDebugInfo('✅ API connection successful');
      return true;
    } catch (error) {
      console.error('API test failed:', error);
      setDebugInfo('❌ API connection failed: ' + error.message);
      return false;
    }
  };

  useEffect(() => {
    const newSocket = io(API_BASE_URL, {
      transports: ['websocket'],
      timeout: 10000,
      forceNew: true
    });

    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
      setConnectionStatus('Connected');
      setSocket(newSocket);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnectionStatus('Disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionStatus('Connection Failed');
    });

    testConnection();

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  const joinRoom = () => {
    if (!username.trim() || !roomId.trim()) {
      setError('Username and Room ID are required.');
      return;
    }

    if (!socket || !socket.connected) {
      setError('Socket connection not established. Please refresh the page.');
      return;
    }

    setError('');
    setLoading(true);

    socket.once('room-joined', (data) => {
      console.log('Successfully joined room:', data.room);
      setLoading(false);
      navigate(`/canvas/${roomId}`, {
        state: { 
          room: data.room, 
          userId: data.userId,
          username: username 
        }
      });
    });

    socket.once('error', (msg) => {
      console.error('Socket error:', msg);
      setError(msg);
      setLoading(false);
    });

    socket.emit('join-room', { roomId: roomId.trim(), username: username.trim() });
  };

  const createRoom = async () => {
    if (!username.trim()) {
      setError('Enter a username to create room.');
      return;
    }

    if (!socket || !socket.connected) {
      setError('Socket connection not established. Please refresh the page.');
      return;
    }

    setError('');
    setLoading(true);
    setDebugInfo('Starting room creation...');

    try {
      console.log('Creating room for username:', username);
      setDebugInfo('🔄 Sending POST request...');
      
      const response = await axios({
        method: 'POST',
        url: `${API_BASE_URL}/api/rooms/create`,
        data: {
          name: `Room by ${username}`
        },
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log('Response data:', response.data);
      setDebugInfo('✅ POST request successful');

      if (!response.data.roomId) {
        throw new Error('Invalid response from server - no roomId received');
      }

      const newRoomId = response.data.roomId;
      console.log('New Room Created with ID:', newRoomId);
      setDebugInfo(`✅ Room created: ${newRoomId}`);
      setRoomId(newRoomId);

      socket.once('room-joined', (data) => {
        console.log('Successfully joined newly created room:', data.room);
        setLoading(false);
        navigate(`/canvas/${newRoomId}`, {
          state: { 
            room: data.room, 
            userId: data.userId,
            username: username 
          }
        });
      });

      socket.once('error', (msg) => {
        console.error('Socket error:', msg);
        setError(`Failed to join room: ${msg}`);
        setLoading(false);
      });

      setDebugInfo('🔄 Joining room via socket...');
      socket.emit('join-room', { roomId: newRoomId, username: username.trim() });

    } catch (err) {
      console.error('Full error object:', err);
      setLoading(false);
      
      let errorMessage = 'Unknown error occurred';
      
      if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to server. Please ensure the backend is running on port 5000.';
        setDebugInfo('❌ Connection refused - server not reachable');
      } else if (err.response) {
        errorMessage = `Server error: ${err.response.status} - ${err.response.data.error || err.response.statusText}`;
        setDebugInfo(`❌ Server error: ${err.response.status}`);
      } else if (err.request) {
        errorMessage = 'No response from server. Check if the server is running and accessible.';
        setDebugInfo('❌ No response from server');
      } else {
        errorMessage = `Error: ${err.message}`;
        setDebugInfo(`❌ Error: ${err.message}`);
      }
      
      setError(errorMessage);
    }
  };

  const getStatusClass = () => {
    if (connectionStatus === 'Connected') return 'status-connected';
    if (connectionStatus === 'Disconnected' || connectionStatus === 'Connection Failed') return 'status-disconnected';
    return 'status-connecting';
  };

  return (
    <div className="room-container">
      <div className="room-content">
        <div className="room-header">
          <h1 className="room-title">Join Your Workspace</h1>
          <p className="room-subtitle">Create a new room or join an existing collaboration</p>
        </div>

        <div className="form-group">
          <label className="form-label">Your Name:</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Room ID (optional):</label>
          <input
            type="text"
            placeholder="Enter Room ID to join existing room"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="button-group">
          <button 
            onClick={joinRoom}
            disabled={loading || !socket || !socket.connected}
            className="btn btn-join"
          >
            <LogIn size={20} />
            {loading ? 'Joining...' : 'Join Room'}
          </button>
          <button 
            onClick={createRoom}
            disabled={loading || !socket || !socket.connected}
            className="btn btn-create"
          >
            <Plus size={20} />
            {loading ? 'Creating...' : 'Create New Room'}
          </button>
        </div>

        {roomId && (
          <div className="room-id-display">
            <p className="room-id-label">
              Room ID: <span className="room-id-value">{roomId}</span>
            </p>
            <p className="room-id-hint">
              Share this ID with others to let them join your room
            </p>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {debugInfo && (
          <div className="alert alert-debug">
            Debug: {debugInfo}
          </div>
        )}

        <div className="status-section">
          <p className="status-item">
            <span className="status-label">Connection Status:</span>
            <span className={`status-value ${getStatusClass()}`}>
              {connectionStatus}
            </span>
          </p>
          <p className="status-item">
            <span className="status-label">Server:</span> {API_BASE_URL}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Room;