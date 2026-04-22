import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as tmImage from '@teachablemachine/image';
import { Shield, Loader2, Camera, VideoOff } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import './WebcamDetector.css';

// Teachable Machine default if none provided
const DEFAULT_TM_URL = "https://teachablemachine.withgoogle.com/models/-YCasu5Jm/";

const WebcamDetector = ({ onStatusChange, onDistractionDetected, sessionActive, active, setActive }) => {
  const videoRef = useRef(null);
  const { 
    aiProvider, 
    teachableUrl, 
    roboflowConfig, 
    confidenceThreshold 
  } = useSettings();

  const [model, setModel] = useState(null);
  const [roboflowModel, setRoboflowModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState([]);
  const [currentStatus, setCurrentStatus] = useState("Idle");
  
  const requestRef = useRef();

  // Load Teachable Machine
  useEffect(() => {
    if (aiProvider !== 'Teachable Machine') return;
    
    const loadTM = async () => {
      setLoading(true);
      try {
        const baseUrl = teachableUrl || DEFAULT_TM_URL;
        const modelURL = baseUrl + (baseUrl.endsWith('/') ? '' : '/') + "model.json";
        const metadataURL = baseUrl + (baseUrl.endsWith('/') ? '' : '/') + "metadata.json";
        const loadedModel = await tmImage.load(modelURL, metadataURL);
        setModel(loadedModel);
        setLoading(false);
      } catch (err) { 
        console.error("TM Model load failed", err);
        setLoading(false); 
      }
    };
    loadTM();
  }, [aiProvider, teachableUrl]);

  // Roboflow Integration Logic (Placeholder for library load)
  useEffect(() => {
    if (aiProvider !== 'Roboflow') return;
    
    // For Roboflow, we often use their Hosted API or a specialized JS library
    const loadRoboflow = async () => {
      setLoading(true);
      // Simulate backend preparation for the model
      await new Promise(r => setTimeout(r, 800));
      setLoading(false);
    };
    loadRoboflow();
  }, [aiProvider, roboflowConfig]);

  const captureFrame = () => {
    if (!videoRef.current) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.6);
  };

  const predict = useCallback(async () => {
    if (aiProvider === 'Teachable Machine' && model && videoRef.current) {
      const prediction = await model.predict(videoRef.current);
      setPredictions(prediction);
      
      const top = prediction.reduce((p, c) => (p.probability > c.probability) ? p : c);
      setCurrentStatus(top.className);
      onStatusChange(top.className, top.probability);
      
      if (top.className.toLowerCase().match(/phone|mobile|distracted/) && top.probability > (confidenceThreshold / 100)) {
        onDistractionDetected();
      }
    } else if (aiProvider === 'Roboflow' && videoRef.current) {
      const image = captureFrame();
      if (!image) return;

      try {
        // We'll perform inference every ~1 second for Roboflow to avoid API rate limits
        // but still maintain focus tracking
        const response = await fetch(`https://detect.roboflow.com/${roboflowConfig.model}/${roboflowConfig.version}?api_key=${roboflowConfig.apiKey}`, {
          method: 'POST',
          body: image
        });
        const data = await response.json();
        
        if (data.predictions && data.predictions.length > 0) {
          const formattedPredictions = data.predictions.map(p => ({
            className: p.class,
            probability: p.confidence
          }));
          setPredictions(formattedPredictions);
          
          const top = formattedPredictions.reduce((p, c) => (p.probability > c.probability) ? p : c);
          setCurrentStatus(top.className);
          onStatusChange(top.className, top.probability);
          
          if (top.className.toLowerCase().match(/phone|mobile|distracted/) && top.probability > (confidenceThreshold / 100)) {
            onDistractionDetected();
          }
        } else {
          setCurrentStatus("No objects detected");
          onStatusChange("Normal", 0.99); // Assume normal if nothing distracting detected
          setPredictions([{ className: 'Searching...', probability: 1 }]);
        }
      } catch (err) {
        console.error("Roboflow Inference Error", err);
      }
    }
    
    // Control frame rate: TM can be faster, Roboflow should be slightly throttled for API
    const delay = aiProvider === 'Roboflow' ? 1000 : 100;
    setTimeout(() => {
      requestRef.current = requestAnimationFrame(predict);
    }, delay);
  }, [model, active, aiProvider, loading, confidenceThreshold, roboflowConfig, onStatusChange, onDistractionDetected]);

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
