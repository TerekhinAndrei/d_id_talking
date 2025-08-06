import React, { useState, useEffect, useRef } from 'react';
import WebRTCService from '../services/webrtc';
import 'webrtc-adapter';

const WebRTCStream = () => {
    const [webrtcService] = useState(() => new WebRTCService());
    const [isConnected, setIsConnected] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [connectionState, setConnectionState] = useState('');
    const [iceConnectionState, setIceConnectionState] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const videoRef = useRef(null);
    const [sourceUrl, setSourceUrl] = useState('https://i.ibb.co/FLj2xx64/photo-2025-07-26-19-56-54.jpg');
    const [audioUrl, setAudioUrl] = useState('https://d-id-public-bucket.s3.us-west-2.amazonaws.com/webrtc.mp3');

    useEffect(() => {
        // Set up event handlers
        webrtcService.setOnTrack((stream) => {
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Safari hotfix
                if (videoRef.current.paused) {
                    videoRef.current.play().catch(e => console.error('Error playing video:', e));
                }
            }
        });

        webrtcService.setOnConnectionStateChange((state) => {
            setConnectionState(state);
            setIsConnected(state === 'connected');
        });

        webrtcService.setOnIceConnectionStateChange((state) => {
            setIceConnectionState(state);
        });

        // Cleanup on unmount
        return () => {
            webrtcService.cleanup();
        };
    }, [webrtcService]);

    const handleConnect = async () => {
        try {
            setLoading(true);
            setError('');

            // Step 1: Create stream
            const { streamId, sessionId, offer, iceServers } = await webrtcService.createStream(sourceUrl);
            
            // Step 2: Create peer connection
            webrtcService.createPeerConnection(iceServers);
            
            // Step 3: Start connection
            await webrtcService.startConnection(offer, iceServers);
            
            setIsConnected(true);
            setError('');
        } catch (err) {
            setError(`Connection failed: ${err.message}`);
            console.error('Connection error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStartStream = async () => {
        try {
            setLoading(true);
            setError('');

            await webrtcService.startTalkStream(audioUrl);
            setIsStreaming(true);
            setError('');
        } catch (err) {
            setError(`Streaming failed: ${err.message}`);
            console.error('Streaming error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            setLoading(true);
            await webrtcService.deleteStream();
            setIsConnected(false);
            setIsStreaming(false);
            setConnectionState('');
            setIceConnectionState('');
            setError('');
        } catch (err) {
            setError(`Disconnect failed: ${err.message}`);
            console.error('Disconnect error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStateColor = (state) => {
        switch (state) {
            case 'connected':
                return 'text-green-600';
            case 'connecting':
                return 'text-yellow-600';
            case 'failed':
            case 'closed':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    return (
        <div className="webrtc-stream-container">
            <div className="controls-section">
                <h2>D-ID WebRTC Streaming</h2>
                
                <div className="input-group">
                    <label>Source Image URL:</label>
                    <input
                        type="text"
                        value={sourceUrl}
                        onChange={(e) => setSourceUrl(e.target.value)}
                        placeholder="Enter image URL"
                        disabled={isConnected}
                    />
                </div>

                <div className="input-group">
                    <label>Audio URL:</label>
                    <input
                        type="text"
                        value={audioUrl}
                        onChange={(e) => setAudioUrl(e.target.value)}
                        placeholder="Enter audio URL"
                        disabled={isStreaming}
                    />
                </div>

                <div className="button-group">
                    {!isConnected ? (
                        <button
                            onClick={handleConnect}
                            disabled={loading}
                            className="connect-btn"
                        >
                            {loading ? 'Connecting...' : 'Connect'}
                        </button>
                    ) : (
                        <>
                            {!isStreaming ? (
                                <button
                                    onClick={handleStartStream}
                                    disabled={loading}
                                    className="start-btn"
                                >
                                    {loading ? 'Starting...' : 'Start Stream'}
                                </button>
                            ) : (
                                <button
                                    onClick={handleDisconnect}
                                    disabled={loading}
                                    className="stop-btn"
                                >
                                    {loading ? 'Stopping...' : 'Stop Stream'}
                                </button>
                            )}
                        </>
                    )}
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <div className="status-section">
                    <div className="status-item">
                        <span>Connection State:</span>
                        <span className={getStateColor(connectionState)}>
                            {connectionState || 'disconnected'}
                        </span>
                    </div>
                    <div className="status-item">
                        <span>ICE State:</span>
                        <span className={getStateColor(iceConnectionState)}>
                            {iceConnectionState || 'disconnected'}
                        </span>
                    </div>
                    <div className="status-item">
                        <span>Streaming:</span>
                        <span className={isStreaming ? 'text-green-600' : 'text-gray-600'}>
                            {isStreaming ? 'active' : 'inactive'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="video-section">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="stream-video"
                />
                {!isConnected && (
                    <div className="video-placeholder">
                        <p>Connect to start streaming</p>
                    </div>
                )}
            </div>

            <style jsx>{`
                .webrtc-stream-container {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    padding: 20px;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .controls-section {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    border: 1px solid #e9ecef;
                }

                .controls-section h2 {
                    margin: 0 0 20px 0;
                    color: #333;
                }

                .input-group {
                    margin-bottom: 15px;
                }

                .input-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 500;
                    color: #555;
                }

                .input-group input {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                }

                .input-group input:disabled {
                    background-color: #f5f5f5;
                    color: #999;
                }

                .button-group {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                }

                .connect-btn, .start-btn, .stop-btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 4px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }

                .connect-btn {
                    background-color: #007bff;
                    color: white;
                }

                .connect-btn:hover:not(:disabled) {
                    background-color: #0056b3;
                }

                .start-btn {
                    background-color: #28a745;
                    color: white;
                }

                .start-btn:hover:not(:disabled) {
                    background-color: #1e7e34;
                }

                .stop-btn {
                    background-color: #dc3545;
                    color: white;
                }

                .stop-btn:hover:not(:disabled) {
                    background-color: #c82333;
                }

                .connect-btn:disabled, .start-btn:disabled, .stop-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .error-message {
                    background-color: #f8d7da;
                    color: #721c24;
                    padding: 10px;
                    border-radius: 4px;
                    border: 1px solid #f5c6cb;
                    margin-bottom: 15px;
                }

                .status-section {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .status-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 5px 0;
                    border-bottom: 1px solid #eee;
                }

                .status-item span:first-child {
                    font-weight: 500;
                    color: #555;
                }

                .video-section {
                    position: relative;
                    background: #000;
                    border-radius: 8px;
                    overflow: hidden;
                    min-height: 400px;
                }

                .stream-video {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .video-placeholder {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: #fff;
                    text-align: center;
                }

                .text-green-600 { color: #059669; }
                .text-yellow-600 { color: #d97706; }
                .text-red-600 { color: #dc2626; }
                .text-gray-600 { color: #4b5563; }
            `}</style>
        </div>
    );
};

export default WebRTCStream; 