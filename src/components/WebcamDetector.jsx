import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as tmImage from '@teachablemachine/image';
import { Camera, Zap } from 'lucide-react';
import './WebcamDetector.css';

const MODEL_URL = "https://teachablemachine.withgoogle.com/models/-YCasu5Jm/";

const WebcamDetector = ({ onStatusChange, onDistractionDetected }) => {
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setActive(true);
    } else {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      setActive(false);
      setCurrentStatus("Idle");
    }
  };

  return (
    <div className={`detector-card glass-effect ${currentStatus.toLowerCase().includes("phone") ? 'alert-pulse' : ''}`}>
      <div className="detector-header">
        <div className="status-badge">
          {active ? <span className="badge-active"><Zap size={14} /> Monitoring</span> : <span className="badge-idle">Standby</span>}
        </div>
        <h3>AI Guard</h3>
      </div>
      <div className="video-container">
        {loading && <div className="loader-overlay">Loading AI...</div>}
        <video ref={videoRef} autoPlay muted playsInline className={active ? 'visible' : 'hidden'} />
        {!active && !loading && <div className="camera-placeholder" onClick={toggleCamera}><Camera size={48} /><p>Start Session</p></div>}
        {active && <div className="detection-overlay"><div className="bracket tl"></div><div className="bracket tr"></div><div className="bracket bl"></div><div className="bracket br"></div><div className="current-label"><span>{currentStatus}</span></div></div>}
      </div>
      <button className={`btn-session ${active ? 'btn-stop' : 'btn-start'}`} onClick={toggleCamera}>{active ? 'Stop Guard' : 'Initialize Guard'}</button>
    </div>
  );
};

export default WebcamDetector;
