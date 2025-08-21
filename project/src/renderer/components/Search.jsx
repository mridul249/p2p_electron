import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Download, RefreshCw, X } from 'lucide-react';

const Search = ({ userInfo }) => {
    const [files, setFiles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const serverUrl = localStorage.getItem('SERVER_URL');

    const fetchFiles = async () => {
        try {
            const url = searchTerm
                ? `${serverUrl}/search_files?filename=${encodeURIComponent(searchTerm)}`
                : `${serverUrl}/files`;
            
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch files');
            const data = await res.json();
            // Filter out own files from search results
            const otherUserFiles = data.files.filter(file => file.username !== userInfo.username);
            setFiles(otherUserFiles);
        } catch (error) {
            console.error("Fetch files error:", error);
            alert('Could not fetch files from the server.');
        }
    };

    useEffect(() => {
        fetchFiles(); // Initial fetch
        const interval = setInterval(() => heartbeat(), 30000); // 30-second heartbeat
        return () => clearInterval(interval);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchFiles();
    };

    const handleClear = () => {
        setSearchTerm('');
        fetchFiles();
    };
    
    const handleDownload = (file) => {
        window.electron.sendFile({
            filename: file.filename,
            peer_ip: file.peer_ip,
            peer_port: file.peer_port
        });
    };

    const heartbeat = () => {
        fetch(`${serverUrl}/heartbeat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: userInfo.username,
                ip: userInfo.ip,
                port: userInfo.port
            })
        }).catch(err => console.error('Heartbeat failed:', err));
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold">Search Network Files</h1>
                 <button onClick={() => fetchFiles()} className="flex items-center gap-2 p-2 bg-black/20 border border-primary-border rounded-lg hover:bg-primary-blue/10 transition-colors"><RefreshCw size={16} /> Refresh</button>
            </div>
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <div className="relative flex-1">
                     <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text"/>
                     <input
                        type="text"
                        placeholder="Search by filename..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2.5 pl-10 bg-panel-bg border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    />
                </div>
                <button type="submit" className="flex items-center gap-2 p-2.5 bg-primary-blue rounded-lg font-semibold hover:bg-blue-500 transition-colors"><SearchIcon size={16} /> Search</button>
                <button type="button" onClick={handleClear} className="flex items-center gap-2 p-2.5 bg-black/20 border border-primary-border rounded-lg hover:bg-primary-blue/10 transition-colors"><X size={16} /> Clear</button>
            </form>
            <div className="flex-1 overflow-y-auto bg-panel-bg border border-primary-border rounded-lg p-2">
                 {files.length > 0 ? (
                    <ul className="space-y-1">
                        {files.map(file => (
                            <li key={`${file.username}-${file.filename}`} className="flex items-center justify-between p-2 rounded-md bg-panel-2-bg/50">
                                <div>
                                    <p className="text-sm">{file.filename}</p>
                                    <p className="text-xs text-muted-text">from {file.username} ({file.peer_ip}:{file.peer_port})</p>
                                </div>
                                <button onClick={() => handleDownload(file)} className="p-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/40 transition-colors"><Download size={16} /></button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center text-muted-text p-10">No files found on the network.</div>
                )}
            </div>
        </div>
    );
};

export default Search;