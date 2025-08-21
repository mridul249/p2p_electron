import React from 'react';
import { LogIn, Folder, Search, Download, LogOut } from 'lucide-react';

const Sidebar = ({ activeSection, setActiveSection, isLoggedIn, userInfo, onLogout, connectionStatus }) => {
    const navItems = [
        { name: 'My Files', section: 'files', icon: Folder, auth: true },
        { name: 'Search', section: 'search', icon: Search, auth: true },
        { name: 'Downloads', section: 'downloads', icon: Download, auth: true },
    ];

    const NavItem = ({ name, section, icon: Icon }) => (
        <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                activeSection === section
                    ? 'bg-primary-blue/10 border border-primary-blue/30 text-primary-text'
                    : 'text-muted-text hover:bg-primary-blue/5 hover:text-primary-text'
            }`}
            onClick={() => setActiveSection(section)}
        >
            <Icon size={20} />
            <span>{name}</span>
        </div>
    );

    return (
        <aside className="bg-panel-bg/60 backdrop-blur-sm border border-primary-border rounded-2xl p-4 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5 font-bold text-lg">
                    <div className="bg-primary-blue rounded-full p-2">
                         <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                            <path d="M12 10h8v4h-8zm0 8h8v4h-8zm-4-4h2v-2h-2zm0 4h2v2h-2z" fill="white"/>
                        </svg>
                    </div>
                    <span>P2P Share</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-text">
                    <div className={`w-2 h-2 rounded-full ${connectionStatus === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>{connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}</span>
                </div>
            </div>

            <nav className="flex flex-col gap-1.5 my-4">
                {!isLoggedIn && (
                    <NavItem name="Login" section="login" icon={LogIn} />
                )}
                {isLoggedIn && navItems.map(item => <NavItem key={item.section} {...item} />)}
            </nav>

            <div className="mt-auto">
                {isLoggedIn && (
                    <>
                        <div className="flex items-center gap-3 bg-black/30 border border-primary-border p-2.5 rounded-xl mb-3">
                            <div className="w-9 h-9 rounded-md bg-gradient-to-br from-primary-blue to-accent-cyan flex items-center justify-center font-bold">
                                {userInfo.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-semibold text-sm">{userInfo.username}</p>
                                <p className="text-xs text-muted-text">{`${userInfo.ip}:${userInfo.port}`}</p>
                            </div>
                        </div>
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center justify-center gap-2 p-2.5 border border-primary-border rounded-lg text-muted-text hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        >
                            <LogOut size={16} /> Logout
                        </button>
                    </>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;