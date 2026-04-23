import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
const tmImage = window.tmImage;
const tmPose = window.tmPose;
const tf = window.tf;
window.tf = tf; // Fix for TM Pose in Vite
import { Shield, Loader2, Camera, VideoOff, RotateCcw } from 'lucide-react';
import { useSettings, ENGINES } from '../context/SettingsContext';
import './WebcamDetector.css';

const WebcamDetector = ({ onStatusChange, onDistractionDetected, sessionActive, active, setActive }) => {
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

  // Load Models based on current provider
  useEffect(() => {
    const loadModels = async () => {
      setLoading(true);
      try {
        if (aiProvider === 'Fast Mode') {
          if (!modelV1) {
            const baseUrl = teachableUrl;
            const mURL = baseUrl + (baseUrl.endsWith('/') ? '' : '/') + "model.json";
            const metaURL = baseUrl + (baseUrl.endsWith('/') ? '' : '/') + "metadata.json";
            const loaded = await tmImage.load(mURL, metaURL);
            setModelV1(loaded);
          }
        } else if (aiProvider === 'Balanced Mode') {
          // Load independently so one failure doesn't block the other
          if (!modelV2Image) {
            try {
              const loaded = await tmImage.load(tmV2Urls.image + "model.json", tmV2Urls.image + "metadata.json");
              setModelV2Image(loaded);
            } catch (e) { console.error("V2 Image load fail", e); }
          }
          if (!modelV2Posture) {
            try {
              const loaded = await window.tmPose.load(tmV2Urls.posture + "model.json", tmV2Urls.posture + "metadata.json");
              setModelV2Posture(loaded);
            } catch (e) { console.error("V2 Posture load fail", e); }
          }
        }
        setLoading(false);
      } catch (err) {
        console.error("Model system load error", err);
        setLoading(false);
      }
    };
    loadModels();
  }, [aiProvider, teachableUrl, tmV2Urls]);

  // Handle Countdown for Precision Mode
  useEffect(() => {
    if (aiProvider === 'Precision Mode' && active) {
      setCountdown(5);
      countdownInterval.current = setInterval(() => {
        setCountdown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else {
      clearInterval(countdownInterval.current);
      setCountdown(0);
    }
    return () => clearInterval(countdownInterval.current);
  }, [aiProvider, active]);

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
    if (!active || loading || !videoRef.current || videoRef.current.readyState < 2) {
      if (active) requestRef.current = requestAnimationFrame(predict);
      return;
    }

    let finalPredictions = [];
    let topClass = "Normal";

    try {
      if (aiProvider === 'Fast Mode' && modelV1) {
        finalPredictions = await modelV1.predict(videoRef.current);
      } 
      else if (aiProvider === 'Balanced Mode') {
        // Run both in parallel for true simultaneous detection
        const results = await Promise.allSettled([
          modelV2Image ? modelV2Image.predict(videoRef.current) : Promise.resolve([]),
          modelV2Posture ? (async () => {
            let posenetData;
            try {
              // TM Pose often crashes with raw <video>. We draw to a canvas first.
              const poseCanvas = document.createElement('canvas');
              poseCanvas.width = videoRef.current.videoWidth;
              poseCanvas.height = videoRef.current.videoHeight;
              const ctx = poseCanvas.getContext('2d');
              ctx.drawImage(videoRef.current, 0, 0);

              const { pose, posenetOutput } = await modelV2Posture.estimatePose(poseCanvas, false);
              posenetData = posenetOutput;
            } catch (err) {
              console.error("estimatePose error:", err);
              return [{ className: `ERR(EST): ${err.message}`, probability: 1 }];
            }
            
            if (!posenetData) return [];
            
            try {
              return await modelV2Posture.predict(posenetData);
            } catch (err) {
              console.error("predict error:", err);
              return [{ className: `ERR(PRED): ${err.message}`, probability: 1 }];
            }
          })() : Promise.resolve([])
        ]);

        
        const combined = results
          .filter(r => r.status === 'fulfilled')
          .map(r => r.value)
          .flat();
        
        if (combined.length > 0) {
          const unique = {};
          // Prefix ALL classes to be 100% sure they don't collide and we see everything
          const imgResults = (results[0].status === 'fulfilled' && Array.isArray(results[0].value)) ? results[0].value : [];
          imgResults.forEach(p => { 
            const name = `[IMG] ${p.className}`;
            unique[name] = { ...p, className: name };
          });

          const posResults = (results[1].status === 'fulfilled' && Array.isArray(results[1].value)) ? results[1].value : [];
          posResults.forEach(p => {
            const name = `[POS] ${p.className}`;
            unique[name] = { ...p, className: name };
          });

          finalPredictions = Object.values(unique)
            .filter(p => {
              const name = p.className.toLowerCase();
              return name !== '[img] focus' && name !== '[img] headphone';
            })
            .sort((a, b) => b.probability - a.probability);
        }
      } 
      else if (aiProvider === 'Precision Mode') {
        if (countdown <= 0) {
          const image = captureFrame();
          if (image) {
            const response = await fetch(`https://detect.roboflow.com/${roboflowConfig.model}/${roboflowConfig.version}?api_key=${roboflowConfig.apiKey}`, {
              method: 'POST',
              body: image
            });
            const data = await response.json();
            if (data.predictions) {
              finalPredictions = data.predictions.map(p => ({
                className: p.class,
                probability: p.confidence,
                bbox: { x: p.x, y: p.y, width: p.width, height: p.height }
              }));
            }
            setCountdown(5);
          }
        }
      }
    } catch (err) {
      console.error("Prediction loop error:", err);
    }

    if (finalPredictions.length > 0) {
      setPredictions(finalPredictions);
      const top = finalPredictions.reduce((p, c) => (p.probability > c.probability) ? p : c);
      topClass = top.className;
      setCurrentStatus(topClass);
      onStatusChange(topClass, top.probability);

      const isDistraction = topClass.toLowerCase().match(/phone|looking|away|yawning|multiple|slouching|earbuds|headphones|smartwatch|eyes/);
      if (isDistraction && top.probability > (confidenceThreshold / 100)) {
        onDistractionDetected();
      }
    }


    const delay = aiProvider === 'Precision Mode' ? 1000 : 100;
    setTimeout(() => {
      requestRef.current = requestAnimationFrame(predict);
    }, delay);
  }, [active, loading, aiProvider, modelV1, modelV2Image, modelV2Posture, roboflowConfig, confidenceThreshold, countdown]);

  useEffect(() => {
    if (active && !loading) requestRef.current = requestAnimationFrame(predict);
    else cancelAnimationFrame(requestRef.current);
    return () => cancelAnimationFrame(requestRef.current);
  }, [active, loading, predict]);

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
    const isBad = name.match(/phone|looking|away|yawning|multiple|slouching|earbuds|headphones|smartwatch|eyes/);
    if (isBad) return 'var(--status-danger)';
    if (name.includes('normal') || name.includes('focus')) return 'var(--status-good)';
    return 'var(--status-info)';
  };

  const statusColor = useMemo(() => {
    const topProb = predictions.find(p => p.className === currentStatus)?.probability || 0;
    return getStatusColor(currentStatus, topProb);
  }, [currentStatus, predictions, active]);

  return (
    <div className={`detector-card-v3 ${active ? 'active-guard' : ''}`} style={{ borderColor: active ? statusColor : 'var(--border-glass)' }}>
      <div className="card-top-label" style={{ background: active ? statusColor : '' }}>
        <Shield size={14} />
        <span>{engine.name.toUpperCase()} VISION</span>
      </div>

      <div className="video-viewport-v3">
        {loading && (
          <div className="loader-overlay">
            <Loader2 className="spin" size={32} />
            <p>{engine.label} Loading...</p>
          </div>
        )}
        
        <video ref={videoRef} autoPlay muted playsInline className={active ? 'visible' : 'hidden'} />

        {!active && !loading && (
          <div className="camera-placeholder-v3">
            <VideoOff size={44} strokeWidth={1.5} />
            <p className="placeholder-text">{engine.name} Standby</p>
          </div>
        )}

        {active && (
          <div className="cam-overlays">
            <div className="overlay-badge top-right scale-down" style={{ background: engine.badgeColor }}>
              <div className="dot pulse-success"></div>
              <span>{engine.interval === 100 ? 'REAL-TIME' : 'API SCAN'}</span>
            </div>

            {aiProvider === 'Precision Mode' && countdown > 0 && (
              <div className="overlay-badge top-left countdown-badge">
                <RotateCcw size={12} className="spin-slow" />
                <span>Next scan in {countdown}s</span>
              </div>
            )}
            
            <div className="overlay-badge bottom-left status-pill-v3" style={{ background: statusColor }}>
              {currentStatus.match(/Phone|Looking|Away|Slouching/) ? '⚠️' : '✅'} {currentStatus}
            </div>

            {aiProvider === 'Precision Mode' && predictions.map((p, i) => p.bbox && (
              <div 
                key={i}
                className="bbox-v3"
                style={{
                  left: `${(p.bbox.x - p.bbox.width/2) / 640 * 100}%`,
                  top: `${(p.bbox.y - p.bbox.height/2) / 480 * 100}%`,
                  width: `${p.bbox.width / 640 * 100}%`,
                  height: `${p.bbox.height / 480 * 100}%`,
                  borderColor: getStatusColor(p.className, p.probability)
                }}
              >
                <span className="bbox-label" style={{ background: getStatusColor(p.className, p.probability) }}>
                  {p.className} {Math.round(p.probability * 100)}%
                </span>
              </div>
            ))}

            <div className="corner-brackets-v3">
              <div className="bracket tl"></div><div className="bracket tr"></div>
              <div className="bracket bl"></div><div className="bracket br"></div>
            </div>
          </div>
        )}
      </div>

      <div className="analysis-footer-v3">
        <div className="footer-label-row">
          <div className="footer-label">
            {engine.label} — 6 Point Analysis
          </div>
          <div className="engine-active-status">
            {aiProvider === 'Balanced Mode' && (
              <>
                <span className={`status-tag ${modelV2Image ? 'tag-live' : 'tag-dead'}`}>IMG</span>
                <span className={`status-tag ${modelV2Posture ? 'tag-live' : 'tag-dead'}`}>POS</span>
              </>
            )}
            {aiProvider === 'Fast Mode' && <span className="status-tag tag-live">V1</span>}
          </div>
        </div>
        <div className="docked-bars-row">
          {predictions.length > 0 ? predictions.slice(0, 8).map(p => (
            <div key={p.className} className="docked-bar-item-v3">
              <div className="bar-label-v3">
                <span className="label-text">{p.className}</span>
                <span className="label-val">{Math.round(p.probability * 100)}%</span>
              </div>
              <div className="bar-progress-v3">
                <div 
                  className="bar-fill-v3"
                  style={{ width: `${p.probability * 100}%`, background: getStatusColor(p.className, p.probability) }}
                ></div>
              </div>
            </div>
          )) : (
            <div className="bars-waiting">
              {aiProvider === 'Balanced Mode' ? (
                <>
                  {!modelV2Image && !modelV2Posture ? "Initializing Dual Engines..." : 
                   !modelV2Image ? "Image Model Loading..." : 
                   !modelV2Posture ? "Posture Model Loading..." : "Awaiting Inference..."}
                </>
              ) : "Awaiting engine telemetry..."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebcamDetector;
