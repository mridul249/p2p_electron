import React, { useState, useEffect } from 'react';
import { Save, TestTube2, LogIn, UserPlus } from 'lucide-react';

const Login = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [serverUrl, setServerUrl] = useState(localStorage.getItem('SERVER_URL') || 'http://localhost:5001');
    const [detectedIp, setDetectedIp] = useState('-');

    useEffect(() => {
        const fetchIp = async () => {
            const ip = await window.electron.getLocalIp();
            setDetectedIp(ip);
        };
        fetchIp();

        // Pre-fill fields if credentials exist in localStorage
        const stored = JSON.parse(localStorage.getItem('p2p_credentials'));
        if (stored?.username && stored?.password) {
            setUsername(stored.username);
            setPassword(stored.password);
        }
    }, []);

    const handleSaveServer = () => {
        localStorage.setItem('SERVER_URL', serverUrl);
        alert('Server URL saved.');
    };

    const handleTestConnection = async () => {
        try {
            const res = await fetch(`${serverUrl}/health`);
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
            const data = await res.json();
            alert(`✅ Connection successful!\nServer Time: ${data.server_time}\nYour IP: ${data.client_ip}`);
        } catch (error) {
            alert(`❌ Connection failed: ${error.message}`);
        }
    };

    const handleApiCall = async (endpoint, body, successMessage) => {
        try {
            const res = await fetch(`${serverUrl}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'An error occurred.');

            if (successMessage) alert(successMessage);
            return data;
        } catch (error) {
            alert(`Error: ${error.message}`);
            return null;
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        const currentIp = await window.electron.getLocalIp();
        const port = await window.electron.getFreePort();
        const body = { username, password, ip: currentIp, port };
        const data = await handleApiCall('/login', body, null);

        if (data && data.username) {
            // Save credentials on successful login
            localStorage.setItem('p2p_credentials', JSON.stringify({ username, password }));
            window.electron.startPeerServer(port);
            onLoginSuccess({ username: data.username, ip: currentIp, port });
        }
    };

    const handleRegister = async () => {
        const currentIp = await window.electron.getLocalIp();
        const port = await window.electron.getFreePort();
        const body = { username, password, ip: currentIp, port };
        await handleApiCall('/register', body, 'Registration successful! You can now log in.');
    };

    return (
        <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold">Welcome to P2P Share</h1>
                <p className="text-muted-text">Connect and share files securely</p>
            </div>
            <div className="bg-panel-bg border border-primary-border rounded-xl p-6 w-full max-w-sm">
                <div className="text-center mb-4">
                    <h2 className="text-xl font-semibold">Sign In</h2>
                    <p className="text-muted-text text-sm">Enter your credentials to join</p>
                </div>
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required className="p-2.5 bg-panel-2-bg border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"/>
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="p-2.5 bg-panel-2-bg border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"/>
                    <div>
                        <input type="text" placeholder="Server URL" value={serverUrl} onChange={e => setServerUrl(e.target.value)} className="p-2.5 bg-panel-2-bg border border-primary-border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-primary-blue"/>
                        <p className="text-xs text-muted-text mt-1">Detected IP: {detectedIp}</p>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={handleSaveServer} className="flex-1 flex items-center justify-center gap-2 p-2 bg-black/20 border border-primary-border rounded-lg hover:bg-primary-blue/10 transition-colors"><Save size={16}/> Save Server</button>
                        <button type="button" onClick={handleTestConnection} className="flex-1 flex items-center justify-center gap-2 p-2 bg-black/20 border border-primary-border rounded-lg hover:bg-primary-blue/10 transition-colors"><TestTube2 size={16}/> Test</button>
                    </div>
                    <button type="submit" className="w-full flex items-center justify-center gap-2 p-2.5 bg-primary-blue rounded-lg font-semibold hover:bg-blue-500 transition-colors"><LogIn size={16}/> Sign In</button>
                    <button type="button" onClick={handleRegister} className="w-full flex items-center justify-center gap-2 p-2.5 bg-black/20 border border-primary-border rounded-lg hover:bg-primary-blue/10 transition-colors"><UserPlus size={16}/> Create Account</button>
                </form>
            </div>
        </div>
    );
};

export default Login;