import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Login from './Login';
import MyFiles from './MyFiles';
import Search from './Search';
import Downloads from './Downloads';

const App = () => {
    const [activeSection, setActiveSection] = useState('login');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userInfo, setUserInfo] = useState({ username: '', ip: '', port: '' });
    const [connectionStatus, setConnectionStatus] = useState('offline');

    // Effect for automatic login on startup
    useEffect(() => {
        const attemptAutoLogin = async () => {
            const storedCreds = localStorage.getItem('p2p_credentials');
            const serverUrl = localStorage.getItem('SERVER_URL');
            if (storedCreds && serverUrl) {
                const { username, password } = JSON.parse(storedCreds);
                const currentIp = await window.electron.getLocalIp();
                const port = await window.electron.getFreePort();

                try {
                    const res = await fetch(`${serverUrl}/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password, ip: currentIp, port }),
                    });
                    const data = await res.json();
                    if (data && data.username) {
                        console.log('Auto-login successful!');
                        window.electron.startPeerServer(port);
                        handleLoginSuccess({ username: data.username, ip: currentIp, port });
                    }
                } catch (error) {
                    console.error('Auto-login failed:', error);
                }
            }
        };
        attemptAutoLogin();
    }, []);

    const handleLoginSuccess = (info) => {
        setUserInfo(info);
        setIsLoggedIn(true);
        setActiveSection('search');
        setConnectionStatus('online');
    };

    const handleLogout = () => {
        localStorage.removeItem('p2p_credentials');
        setUserInfo({ username: '', ip: '', port: '' });
        setIsLoggedIn(false);
        setActiveSection('login');
        setConnectionStatus('offline');
    };

    const renderSection = () => {
        if (!isLoggedIn) {
            return <Login onLoginSuccess={handleLoginSuccess} />;
        }
        switch (activeSection) {
            case 'files':
                return <MyFiles userInfo={userInfo} />;
            case 'search':
                return <Search userInfo={userInfo}/>;
            case 'downloads':
                return <Downloads />;
            default:
                return <Search userInfo={userInfo}/>;
        }
    };

    return (
        <div className="w-screen h-screen min-h-0 min-w-0 flex font-sans">
            <Sidebar
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                isLoggedIn={isLoggedIn}
                userInfo={userInfo}
                onLogout={handleLogout}
                connectionStatus={connectionStatus}
            />
            <main className="flex-1 h-full bg-panel-2-bg/60 border border-primary-border rounded-2xl shadow-2xl p-5 overflow-hidden flex flex-col">
                {renderSection()}
            </main>
        </div>
    );
};

export default App;