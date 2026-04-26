import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
const tmImage = window.tmImage;
const tmPose = window.tmPose;
const tf = window.tf;
window.tf = tf; // Fix for TM Pose in Vite
import { Shield, Loader2, Camera, VideoOff, RotateCcw } from 'lucide-react';
import { useSettings, ENGINES } from '../context/SettingsContext';
import './WebcamDetector.css';

const WebcamDetector = ({ onStatusChange, sessionActive, active, escalationLevel }) => {
  const videoRef = useRef(null);
  const { 
    aiProvider, setAiProvider,
    teachableUrl, setTeachableUrl,
    tmV2Urls, setTmV2Urls,
    roboflowConfig, setRoboflowConfig,
    confidenceThreshold, setConfidenceThreshold,
    modelV1, setModelV1,
    modelV2Image, setModelV2Image,
    modelV2Posture, setModelV2Posture
  } = useSettings();
  
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState([]);
  const [currentStatus, setCurrentStatus] = useState("Idle");
  const [countdown, setCountdown] = useState(0);
  
  const requestRef = useRef();
  const countdownInterval = useRef();

  // Unified Engine Config from Context
  const engine = useMemo(() => {
    return Object.values(ENGINES).find(e => e.id === aiProvider) || ENGINES.TM_V1;
  }, [aiProvider]);

  // Load Models
  useEffect(() => {
    const loadModels = async () => {
      setLoading(true);
      try {
        if (aiProvider === 'Fast Mode' && !modelV1) {
          const loaded = await tmImage.load(teachableUrl + "model.json", teachableUrl + "metadata.json");
          setModelV1(loaded);
        } else if (aiProvider === 'Balanced Mode') {
          if (!modelV2Image) {
            const loaded = await tmImage.load(tmV2Urls.image + "model.json", tmV2Urls.image + "metadata.json");
            setModelV2Image(loaded);
          }
          if (!modelV2Posture) {
            const loaded = await window.tmPose.load(tmV2Urls.posture + "model.json", tmV2Urls.posture + "metadata.json");
            setModelV2Posture(loaded);
          }
        }
        setLoading(false);
      } catch (err) {
        console.error("Model load error", err);
        setLoading(false);
      }
    };
    loadModels();
  }, [aiProvider, teachableUrl, tmV2Urls]);

  const captureFrame = () => {
    if (!videoRef.current) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.6);
  };

  const lastScanTime = useRef(0);

  const predict = useCallback(async () => {
    if (!active || loading || !videoRef.current || videoRef.current.readyState < 2) {
      if (active) requestRef.current = requestAnimationFrame(predict);
      return;
    }

    // Throttle for Precision Mode (5 seconds)
    if (aiProvider === 'Precision Mode') {
      const now = Date.now();
      if (now - lastScanTime.current < 5000) {
        requestRef.current = requestAnimationFrame(predict);
        return;
      }
      lastScanTime.current = now;
    }

    let finalPredictions = [];
    try {
      if (aiProvider === 'Fast Mode' && modelV1) {
        finalPredictions = await modelV1.predict(videoRef.current);
      } 
      else if (aiProvider === 'Balanced Mode' || aiProvider === 'Precision Mode') {
        const results = await Promise.allSettled([
          modelV2Image ? modelV2Image.predict(videoRef.current) : Promise.resolve([]),
          modelV2Posture ? (async () => {
            const poseCanvas = document.createElement('canvas');
            poseCanvas.width = videoRef.current.videoWidth;
            poseCanvas.height = videoRef.current.videoHeight;
            poseCanvas.getContext('2d').drawImage(videoRef.current, 0, 0);
            const { posenetOutput } = await modelV2Posture.estimatePose(poseCanvas, false);
            return posenetOutput ? await modelV2Posture.predict(posenetOutput) : [];
          })() : Promise.resolve([])
        ]);

        const unique = {};
        if (results[0].status === 'fulfilled') {
          results[0].value.forEach(p => unique[`[IMG] ${p.className}`] = { ...p, className: `[IMG] ${p.className}` });
        }
        if (results[1].status === 'fulfilled') {
          results[1].value.forEach(p => unique[`[POS] ${p.className}`] = { ...p, className: `[POS] ${p.className}` });
        }
        finalPredictions = Object.values(unique)
          .filter(p => !p.className.toLowerCase().includes('headphone'))
          .sort((a, b) => b.probability - a.probability);
      }
    } catch (err) { console.error("Predict error", err); }

    if (finalPredictions.length > 0) {
      setPredictions(finalPredictions);
      const top = finalPredictions[0];
      setCurrentStatus(top.className);
      onStatusChange(top.className, top.probability);
    }

    requestRef.current = requestAnimationFrame(predict);
  }, [active, loading, aiProvider, modelV1, modelV2Image, modelV2Posture]);

  useEffect(() => {
    if (active && !loading) requestRef.current = requestAnimationFrame(predict);
    return () => cancelAnimationFrame(requestRef.current);
  }, [active, loading, predict]);

  // Precision Mode Countdown Timer
  useEffect(() => {
    let timer;
    if (active && aiProvider === 'Precision Mode') {
      setCountdown(5);
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) return 5;
          return prev - 1;
        });
      }, 1000);
    } else {
      setCountdown(0);
    }
    return () => clearInterval(timer);
  }, [active, aiProvider]);

  useEffect(() => {
    if (active && videoRef.current && !videoRef.current.srcObject) {
      navigator.mediaDevices.getUserMedia({ video: true }).then(s => videoRef.current.srcObject = s);
    } else if (!active && videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
  }, [active]);

  const getStatusColor = (className) => {
    const name = className.toLowerCase();
    if (name.match(/phone|looking|away|yawning|multiple|slouching/)) return 'var(--status-danger)';
    if (name.includes('focused')) return 'var(--status-good)';
    return 'var(--status-info)';
  };

  return (
    <div 
      className={`detector-card-v3 ${active ? 'active-guard' : ''} ${escalationLevel >= 1 ? 'pulse-red-border' : ''}`} 
      style={{ borderColor: active ? (escalationLevel >= 1 ? '#ef4444' : getStatusColor(currentStatus)) : 'var(--border-glass)' }}
    >
      <div className="card-top-label" style={{ background: active ? getStatusColor(currentStatus) : '' }}>
        <Shield size={14} />
        <span>{engine.name.toUpperCase()} VISION</span>
      </div>

      <div className="video-viewport-v3">
        {loading && <div className="loader-overlay"><Loader2 className="spin" size={32} /><p>Loading Engine...</p></div>}
        <video ref={videoRef} autoPlay muted playsInline className={active ? 'visible' : 'hidden'} />
        {!active && !loading && <div className="camera-placeholder-v3"><VideoOff size={44} /><p>{engine.name} Standby</p></div>}
        {active && (
          <div className="cam-overlays">
            <div className="overlay-badge top-right" style={{ background: engine.badgeColor }}>
              <div className="dot pulse-success"></div><span>{aiProvider === 'Precision Mode' ? `NEXT SCAN IN ${countdown}s` : (engine.interval === 100 ? 'REAL-TIME' : 'API SCAN')}</span>
            </div>
            {aiProvider === 'Precision Mode' && (
              <div className="precision-scanning-overlay">
                <div className="scan-line"></div>
                <div className="scan-timer">Next Scan in {countdown}s</div>
              </div>
            )}
            <div className="overlay-badge bottom-left status-pill-v3" style={{ background: getStatusColor(currentStatus) }}>
               {currentStatus}
            </div>
          </div>
        )}
      </div>

      <div className="analysis-footer-v3">
        <div className="footer-label-row"><div className="footer-label">{engine.label} — 6 Point Analysis</div></div>
        <div className="docked-bars-row">
          {[
            { label: 'FOCUS', match: 'focus' },
            { label: 'LOOKING AWAY', match: 'looking' },
            { label: 'PHONE', match: 'phone' },
            { label: 'AWAY', match: 'away' },
            { label: 'YAWN', match: 'yawn' },
            { label: 'MULTIPLE PERSON', match: 'multiple' }
          ].map(cls => {
            const p = predictions.find(pred => pred.className.toLowerCase().includes(cls.match)) || { probability: 0 };
            return (
              <div key={cls.label} className="docked-bar-item-v3">
                <div className="bar-label-v3"><span>{cls.label}</span><span>{Math.round(p.probability * 100)}%</span></div>
                <div className="bar-progress-v3"><div className="bar-fill-v3" style={{ width: `${p.probability * 100}%`, background: getStatusColor(cls.match) }}></div></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WebcamDetector;
