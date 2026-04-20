import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as tmImage from '@teachablemachine/image';
import { Shield, Loader2, Camera, VideoOff } from 'lucide-react';
import './WebcamDetector.css';

const MODEL_URL = "https://teachablemachine.withgoogle.com/models/-YCasu5Jm/";

const WebcamDetector = ({ onStatusChange, onDistractionDetected, sessionActive, active, setActive }) => {
  const videoRef = useRef(null);
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
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
      
      // Detection alerting logic
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

  useEffect(() => {
    if (active && videoRef.current && !videoRef.current.srcObject) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(err => {
          console.error("Camera error", err);
          setActive(false);
        });
    } else if (!active && videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
  }, [active, setActive]);

  const getStatusColor = (className, prob) => {
    if (!active) return 'var(--text-dim)';
    const name = className.toLowerCase();
    if (name.includes('phone') || name.includes('distracted')) return 'var(--status-danger)';
    if (name.includes('normal') || name.includes('focus')) return 'var(--status-good)';
    return 'var(--status-info)';
  };

  const statusColor = useMemo(() => {
    const topProb = predictions.find(p => p.className === currentStatus)?.probability || 0;
    return getStatusColor(currentStatus, topProb);
  }, [currentStatus, predictions, active]);

  return (
    <div className={`detector-card-v3 ${active ? 'active-guard' : ''}`} style={{ borderColor: active ? statusColor : 'var(--border-glass)' }}>
      <div className="card-top-label">
        <Shield size={14} />
        <span>VISION GUARD</span>
      </div>

      <div className="video-viewport-v3">
        {loading && (
          <div className="loader-overlay">
            <Loader2 className="spin" size={32} />
            <p>AI Core Initializing...</p>
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
          <div className="camera-placeholder-v3">
            <VideoOff size={44} strokeWidth={1.5} />
            <p className="placeholder-text">Vision Guard Standby</p>
          </div>
        )}

        {/* OVERLAYS */}
        {active && (
          <div className="cam-overlays">
            <div className="overlay-badge top-right scale-down">
              <div className="dot pulse-success"></div>
              <span>READY</span>
            </div>
            
            <div className="overlay-badge bottom-left status-pill-v3" style={{ background: statusColor }}>
              {currentStatus.includes('Phone') ? '📱' : '✅'} {currentStatus}
            </div>

            <div className="corner-brackets-v3">
              <div className="bracket tl"></div>
              <div className="bracket tr"></div>
              <div className="bracket bl"></div>
              <div className="bracket br"></div>
            </div>
          </div>
        )}
      </div>

      {/* ANALYSIS FOOTER */}
      <div className="analysis-footer-v3">
        <div className="footer-label">Live Inference Analysis</div>
        <div className="docked-bars-row">
          {predictions.map(p => (
            <div key={p.className} className="docked-bar-item-v3">
              <div className="bar-label-v3">
                <span className="label-text">{p.className.replace('/', ' / ')}</span>
                <span className="label-val">— {Math.round(p.probability * 100)}%</span>
              </div>
              <div className="bar-progress-v3">
                <div 
                  className={`bar-fill-v3 ${p.className.toLowerCase().match(/phone|distracted|earbuds/) && p.probability > 0.8 ? 'pulse-alert' : ''}`}
                  style={{ 
                    width: `${p.probability * 100}%`, 
                    background: getStatusColor(p.className, p.probability) 
                  }}
                ></div>
              </div>
            </div>
          ))}
          {predictions.length === 0 && <div className="bars-waiting">Awaiting Inference Data...</div>}
        </div>
      </div>
    </div>
  );
};

export default WebcamDetector;
