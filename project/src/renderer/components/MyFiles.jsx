import React, { useState, useEffect } from 'react';
import { Folder, RefreshCw, Upload } from 'lucide-react';

const MyFiles = ({ userInfo }) => { // Accept userInfo as a prop
    const [myFiles, setMyFiles] = useState([]);
    const serverUrl = localStorage.getItem('SERVER_URL');

    const populateMyFiles = async () => {
        const files = await window.electron.getSharedFiles();
        setMyFiles(files);
    };
    
    useEffect(() => {
        populateMyFiles();
    }, []);

    const shareFilesWithServer = async (filesToShare) => {
        try {
            const response = await fetch(`${serverUrl}/share_files`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: userInfo.username,
                    filename: filesToShare,
                    peer_ip: userInfo.ip,
                    peer_port: userInfo.port
                })
            });
            if (!response.ok) {
                throw new Error('Server responded with an error');
            }
            const data = await response.json();
            console.log('Server response:', data.message);
        } catch (error) {
            console.error('Failed to share files with server:', error);
            alert('Files were copied locally, but failed to publish to the network.');
        }
    };

    const handleShareFiles = async () => {
        const copiedCount = await window.electron.shareFilesDialog();
        if (copiedCount > 0) {
            alert(`${copiedCount} file(s) are now being shared locally! Publishing to the network...`);
            // Refresh the local list immediately
            const updatedFiles = await window.electron.getSharedFiles();
            setMyFiles(updatedFiles);
            // Tell the server about ALL currently shared files
            await shareFilesWithServer(updatedFiles);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold">My Shared Files</h1>
                <div className="flex gap-2">
                    <button onClick={populateMyFiles} className="flex items-center gap-2 p-2 bg-black/20 border border-primary-border rounded-lg hover:bg-primary-blue/10 transition-colors"><RefreshCw size={16} /> Refresh</button>
                    <button onClick={handleShareFiles} className="flex items-center gap-2 p-2 bg-primary-blue rounded-lg font-semibold hover:bg-blue-500 transition-colors"><Upload size={16} /> Share Files</button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-panel-bg border border-primary-border rounded-lg p-2">
                {myFiles.length > 0 ? (
                    <ul className="space-y-1">
                        {myFiles.map(file => (
                            <li key={file} className="flex items-center p-2 rounded-md bg-panel-2-bg/50">
                                <Folder size={18} className="mr-3 text-primary-blue" />
                                <span className="text-sm">{file}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center text-muted-text p-10">No files shared yet.</div>
                )}
            </div>
        </div>
    );
};

export default MyFiles;