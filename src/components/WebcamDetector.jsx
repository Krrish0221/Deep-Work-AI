import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as tmImage from '@teachablemachine/image';
import { Camera, Zap, Shield, Info, Loader2, VideoOff } from 'lucide-react';
import './WebcamDetector.css';

const MODEL_URL = "https://teachablemachine.withgoogle.com/models/-YCasu5Jm/";

const WebcamDetector = ({ onStatusChange, onDistractionDetected, onSessionToggle, sessionActive }) => {
  const videoRef = useRef(null);
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [currentStatus, setCurrentStatus] = useState("Idle");
  
  const requestRef = useRef();

  useEffect(() => {
    const loadModel = async () => {
      try {
        const modelURL = MODEL_URL + "model.json";
        const metadataURL = MODEL_URL + "metadata.json";
        const loadedModel = await tmImage.load(modelURL, metadataURL);
        setModel(loadedModel);
        setLoading(false);
      } catch (err) { console.error("Model load failed", err); }
    };
    loadModel();
  }, []);

  const predict = useCallback(async () => {
    if (model && videoRef.current && active) {
      const prediction = await model.predict(videoRef.current);
      setPredictions(prediction);
      
      const top = prediction.reduce((p, c) => (p.probability > c.probability) ? p : c);
      setCurrentStatus(top.className);
      onStatusChange(top.className, top.probability);
      
      // Semantic alerting logic
      if (top.className.toLowerCase().match(/phone|mobile|distracted/) && top.probability > 0.85) {
        onDistractionDetected();
      }
    }
    requestRef.current = requestAnimationFrame(predict);
  }, [model, active, onStatusChange, onDistractionDetected]);

  useEffect(() => {
    if (active) requestRef.current = requestAnimationFrame(predict);
    else cancelAnimationFrame(requestRef.current);
    return () => cancelAnimationFrame(requestRef.current);
  }, [active, predict]);

  const toggleCamera = async () => {
    if (!active) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        setActive(true);
        onSessionToggle(true); // Signal session start
      } catch (err) { alert("Camera access denied"); }
    } else {
      if (videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
      setActive(false);
      setCurrentStatus("Idle");
      setPredictions([]);
      onSessionToggle(false); // Signal session stop
    }
  };

  const getBarColor = (className, prob) => {
    if (prob < 0.2) return 'rgba(255, 255, 255, 0.1)';
    const name = className.toLowerCase();
    if (name.includes('phone') || name.includes('distracted')) return 'var(--status-danger)';
    if (name.includes('normal') || name.includes('focus')) return 'var(--status-good)';
    return 'var(--status-info)';
  };

  return (
    <div className={`detector-card glass-effect ${active ? 'active-guard' : ''}`}>
      <div className="detector-header">
        <div className="header-info">
          <span className="text-xs">Focus Guard v1.0</span>
          <h3>Live AI Monitor</h3>
        </div>
        <div className="status-badge-container">
          {active ? (
            <div className="badge badge-success pulse-animation">
              <Zap size={14} fill="currentColor" /> MONITORING
            </div>
          ) : (
            <div className="badge badge-primary">
              <VideoOff size={14} /> SYSTEM STANDBY
            </div>
          )}
        </div>
      </div>

      <div className={`video-container ${!active ? 'inactive' : ''}`}>
        {loading && (
          <div className="loader-overlay">
            <Loader2 className="spin" size={32} />
            <p>Neural Engine Loading...</p>
          </div>
        )}
        
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline 
          className={active ? 'visible' : 'hidden'} 
        />

        {!active && !loading && (
          <div className="camera-placeholder" onClick={toggleCamera}>
            <div className="placeholder-icon-bg">
              <Camera size={48} strokeWidth={1} />
            </div>
            <div className="placeholder-content">
              <h4>Vision Guard Offline</h4>
              <p>Initialize the AI engine to start your secure focus session.</p>
            </div>
          </div>
        )}

        {active && (
          <div className="detection-overlay">
            <div className="corner-brackets">
              <div className="bracket tl"></div>
              <div className="bracket tr"></div>
              <div className="bracket bl"></div>
              <div className="bracket br"></div>
            </div>
            
            <div className="current-status-overlay">
              <Shield size={16} color={getBarColor(currentStatus, predictions.find(p => p.className === currentStatus)?.probability)} />
              <span className="status-text">{currentStatus}</span>
            </div>
          </div>
        )}
      </div>

      <div className="detector-controls">
        <button 
          className={`btn-session ${active ? 'btn-stop' : 'btn-start'}`} 
          onClick={toggleCamera}
          disabled={loading}
        >
          {active ? 'Terminate Guard' : 'Initialize Focus Guard'}
        </button>
        
        <div className="detection-bars">
          <div className="bars-header">
            <h4>Live Feed Analysis</h4>
            <div className="info-tooltip">
              <Info size={14} />
              <span className="tooltip-text">Inference confidence for detected object classes</span>
            </div>
          </div>
          <div className="bars-list">
            {predictions.length > 0 ? predictions.map(p => (
              <div key={p.className} className="bar-item">
                <div className="bar-labels">
                  <span className="bar-name">{p.className}</span>
                  <span className="bar-percent">{(p.probability * 100).toFixed(1)}%</span>
                </div>
                <div className="bar-track">
                  <div 
                    className="bar-fill" 
                    style={{ 
                      width: `${p.probability * 100}%`, 
                      background: getBarColor(p.className, p.probability) 
                    }}
                  ></div>
                </div>
              </div>
            )) : (
              <p className="bars-empty">Awaiting model inference...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebcamDetector;
