import React, { useState, useEffect } from 'react';
import { Folder, RefreshCw } from 'lucide-react';

const Downloads = () => {
    const [downloadedFiles, setDownloadedFiles] = useState([]);
    const [progress, setProgress] = useState({ filename: '', percentage: 0 });
    const [status, setStatus] = useState('No active downloads');

    const populateDownloads = async () => {
        try {
            const files = await window.electron.getDownloadedFiles();
            setDownloadedFiles(files);
        } catch (e) {
            console.error('populateDownloads error', e);
            alert('Error loading your downloaded files.');
        }
    };
    
    useEffect(() => {
        populateDownloads();

        const unsubProgress = window.electron.on('download-progress', ({ filename, progress }) => {
            setProgress({ filename, percentage: progress });
            setStatus(`Downloading ${filename}: ${progress.toFixed(1)}%`);
        });

        const unsubComplete = window.electron.on('download-complete', (filename) => {
            setStatus(`Download of ${filename} complete!`);
            populateDownloads();
            setTimeout(() => {
                setProgress({ filename: '', percentage: 0 });
                setStatus('No active downloads');
            }, 3000);
        });

        const unsubError = window.electron.on('download-error', (message) => {
            setStatus(`Error: ${message}`);
             setTimeout(() => {
                setProgress({ filename: '', percentage: 0 });
                setStatus('No active downloads');
            }, 5000);
        });

        return () => {
            unsubProgress();
            unsubComplete();
            unsubError();
        };
    }, []);

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold">Downloads</h1>
                <button onClick={populateDownloads} className="flex items-center gap-2 p-2 bg-black/20 border border-primary-border rounded-lg hover:bg-primary-blue/10 transition-colors"><RefreshCw size={16} /> Refresh</button>
            </div>
            
            <div className="bg-panel-bg border border-primary-border rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Current Download</h3>
                    <span className="text-sm text-muted-text">{status}</span>
                </div>
                <div className="w-full bg-panel-2-bg rounded-full h-2.5 border border-primary-border">
                    <div className="bg-gradient-to-r from-primary-blue to-accent-cyan h-full rounded-full transition-all duration-300" style={{ width: `${progress.percentage}%` }}></div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-panel-bg border border-primary-border rounded-lg p-2">
                {downloadedFiles.length > 0 ? (
                    <ul className="space-y-1">
                        {downloadedFiles.map(file => (
                            <li key={file} className="flex items-center p-2 rounded-md bg-panel-2-bg/50">
                                <Folder size={18} className="mr-3 text-accent-cyan" />
                                <span className="text-sm">{file}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center text-muted-text p-10">No downloaded files yet.</div>
                )}
            </div>
        </div>
    );
};

export default Downloads;