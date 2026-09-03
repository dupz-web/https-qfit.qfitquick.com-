export const Sound = (function(){
  let ctx = null;
  let muted = false;
  let bgmMuted = false;
  let sfxMuted = false;
  let bgmInterval = null;
  let bgmStep = 0;
  let bgmBoss = false;
  let currentBGMVariant = 0;
  let currentBGMIntensified = false;
  let audioUnlockConfirmed = false;

  function ensureCtx(){
    if(!ctx){ ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    if(ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur, {type='sine', gain=0.2, delay=0, glideTo=null, attack=0.004} = {}){
    if(muted) return;
    const ac = ensureCtx();
    const t0 = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if(glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ac.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }
  function noiseBurst(dur, {gain=0.18, delay=0, filterFreq=1500, filterFreqEnd=null} = {}){
    if(muted) return;
    const ac = ensureCtx();
    const t0 = ac.currentTime + delay;
    const size = Math.floor(ac.sampleRate * dur);
    const buffer = ac.createBuffer(1, size, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i=0;i<size;i++){ data[i] = (Math.random()*2-1) * (1 - i/size); }
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const filt = ac.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.setValueAtTime(filterFreq, t0);
    if(filterFreqEnd){ filt.frequency.exponentialRampToValueAtTime(filterFreqEnd, t0 + dur); }
    const g = ac.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filt).connect(g).connect(ac.destination);
    src.start(t0);
  }
  function kick(t0delay=0, {gain=0.32} = {}){
    // punchier "club" kick: quick pitch drop (150Hz -> 45Hz) + tiny click transient,
    // instead of a plain static sine — this is what actually reads as a club kick
    if(muted) return;
    const ac = ensureCtx();
    const t0 = ac.currentTime + t0delay;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t0);
    osc.frequency.exponentialRampToValueAtTime(45, t0 + 0.09);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
    osc.connect(g).connect(ac.destination);
    osc.start(t0); osc.stop(t0 + 0.24);
    noiseBurst(0.02, {gain:gain*0.5, delay:t0delay, filterFreq:4000});
  }

  return {
    unlock(){
      const ac = ensureCtx();
      try{
        const buf = ac.createBuffer(1,1,22050);
        const src = ac.createBufferSource();
        src.buffer = buf; src.connect(ac.destination); src.start(0);
      }catch(e){}
      if(!audioUnlockConfirmed){
        try{
          // playing a real HTML5 <audio> element is what actually grants
          // audio permission on some phones — Web Audio tricks alone
          // weren't enough. This also doubles as the "unlock chime".
          // Only mark as confirmed once play() actually succeeds — if it
          // silently fails (e.g. right after launching from the home
          // screen icon, before iOS has settled), the NEXT button press
          // will retry instead of staying silent for the whole session.
          const a = document.getElementById('test-audio');
          if(a){
            a.volume = 0.09;
            const p = a.play();
            if(p && p.then){
              p.then(()=>{ audioUnlockConfirmed = true; }).catch(()=>{});
            } else {
              audioUnlockConfirmed = true;
            }
          }
        }catch(e){}
      }
      // Mobile browsers (esp. iOS Safari, some Android WebViews) require
      // speechSynthesis to be "primed" inside a real user gesture before
      // any later speak() call (e.g. from a setTimeout during gameplay)
      // will actually produce sound. Without this, exercise-name voice
      // announcements are silently swallowed on phones.
      try{
        if(window.speechSynthesis){
          const warm = new SpeechSynthesisUtterance(' ');
          warm.volume = 0.01;
          window.speechSynthesis.speak(warm);
        }
      }catch(e){}
    },
    toggleMute(){ muted = !muted; return muted; },
    isMuted(){ return muted; },
    setBgmMuted(v){ bgmMuted = v; if(v) this.stopBGM(); },
    isBgmMuted(){ return bgmMuted; },
    setSfxMuted(v){ sfxMuted = v; },
    isSfxMuted(){ return sfxMuted; },
    countBeep(n){ if(sfxMuted) return; tone(n===0 ? 920 : 460, 0.13, {type:'triangle', gain:0.3}); },
    tap(comboN){
      if(sfxMuted) return;
      const pitch = 480 + Math.min(comboN,20)*22;
      tone(pitch, 0.08, {type:'triangle', gain:0.26, glideTo:pitch*1.3});
      tone(pitch*1.01, 0.08, {type:'triangle', gain:0.14, glideTo:pitch*1.31}); // slight detune layer = thicker, more "synth-pop" pluck
    },
    holdTick(){ if(sfxMuted) return; tone(700, 0.05, {type:'sine', gain:0.11}); },
    chaseThump(){ if(sfxMuted) return; kick(0, {gain:0.22}); },
    clear(){
      if(sfxMuted) return;
      [523,659,784,1047].forEach((f,i)=>{
        tone(f, 0.24, {type:'triangle', gain:0.28, delay:i*0.06});
        tone(f*1.005, 0.24, {type:'triangle', gain:0.12, delay:i*0.06}); // detune layer for width
      });
      tone(2093, 0.35, {type:'sine', gain:0.1, delay:0.18}); // bright shimmer on top, trendy "sparkle" finish
    },
    timeup(){
      if(sfxMuted) return;
      noiseBurst(0.16, {gain:0.28, filterFreq:500});
      tone(160, 0.2, {type:'sawtooth', gain:0.2, glideTo:80});
    },
    bossHit(){
      if(sfxMuted) return;
      tone(200, 0.4, {type:'sawtooth', gain:0.26, glideTo:420});
      tone(200, 0.4, {type:'sawtooth', gain:0.26, delay:0.2, glideTo:420});
    },
    fanfare(){
      if(sfxMuted) return;
      tone(300, 0.5, {type:'sawtooth', gain:0.05, glideTo:2400}); // quick riser into the fanfare, modern "hype" build
      [392,523,659,784,988].forEach((f,i)=>{
        tone(f, 0.3, {type:'triangle', gain:0.28, delay:0.1 + i*0.08});
        tone(f*1.006, 0.3, {type:'triangle', gain:0.13, delay:0.1 + i*0.08}); // detune layer for width
      });
      tone(1976, 0.4, {type:'sine', gain:0.12, delay:0.5}); // sparkle top note on the last chord
    },
    startBGM(intensify, variantIndex){
      if(bgmInterval || bgmMuted) return;
      bgmStep = 0;
      currentBGMVariant = variantIndex || 0;
      const stepMs = intensify ? 80 : 92; // phase 2 (after rest) pushes tempo up further — ~200bpm
      // a handful of different root notes + melody directions to cycle
      // through per set, so each set feels like its own little tune
      // instead of one loop running the whole workout
      const BGM_ROOTS = [55, 49, 65, 61]; // A1, G1, C2, B1-ish — all close enough to stay cohesive
      const variant = ((variantIndex || 0) % BGM_ROOTS.length);
      const baseRoot = BGM_ROOTS[variant];
      // two-bar (32-step) progression: i - v - VI - IV feel, so the loop
      // actually moves somewhere instead of looping the same 1-bar riff
      const bassPattern = [
        0,0,0,0, 3,3,3,3, 0,0,0,0, 5,5,3,3,
        7,7,7,7, 5,5,5,5, 8,8,8,8, 5,5,3,3
      ];
      // a running minor-pentatonic arpeggio (up then back down) instead of
      // a sparse call-and-response line — this IS the hook now, not the beat
      let pluckPattern = [
        0,3,5,7,10,12,15,17,19,22,24,22,19,17,15,12,
        10,7,5,3,0,0,3,5,7,null,10,null,12,null,15,null
      ];
      if(variant % 2 === 1) pluckPattern = pluckPattern.slice().reverse(); // odd sets run the melody backwards for extra variety
      // broken/syncopated kick instead of a plain four-on-the-floor march —
      // less "basic drum machine", more energy from the melody itself
      const kickSteps = new Set([0,6,10,16,22,26]);
      const clapSteps = new Set([8,24]);
      const energyGain = intensify ? 1.25 : 1; // phase 2 hits harder across the board
      bgmInterval = setInterval(()=>{
        const s = bgmStep % 32;
        const rootFreq = bgmBoss ? baseRoot * 1.25 : baseRoot;
        const bigHit = s === 0; // the "drop" landing right after the riser
        if(kickSteps.has(s)){ kick(0, {gain: (bigHit ? 0.4 : 0.32) * energyGain}); }
        if(s % 2 === 0){ // bass stab riff on the off-8ths, with a sub layer underneath
          const semis = bassPattern[s];
          const freq = rootFreq * Math.pow(2, semis/12) * 2;
          tone(freq, 0.09, {type:'sawtooth', gain: (bigHit ? 0.15 : 0.11) * energyGain});
          tone(freq/2, 0.11, {type:'sine', gain: (bigHit ? 0.22 : 0.16) * energyGain}); // sub bass — low-end weight
        }
        const pluckSemis = pluckPattern[s];
        if(pluckSemis !== null){ // the main hook — fast running arpeggio carries the energy
          const pluckFreq = rootFreq * Math.pow(2, pluckSemis/12) * 4;
          tone(pluckFreq, 0.1, {type:'triangle', gain:0.1 * energyGain});
          tone(pluckFreq*1.005, 0.1, {type:'triangle', gain:0.045 * energyGain}); // slight detune = brighter/thicker
          tone(pluckFreq*2, 0.08, {type:'triangle', gain:0.02 * energyGain}); // octave-up sparkle layer for extra brightness
        }
        if(clapSteps.has(s)){ noiseBurst(0.1, {gain:0.26 * energyGain, filterFreq:2800}); }
        if(s % 2 === 0){ noiseBurst(0.016, {gain: s % 4 === 2 ? 0.05 : 0.03, filterFreq: s % 4 === 2 ? 8500 : 6800}); } // 8th-note hats — steady but not a nonstop hiss
        // build-up riser into the last beat of every 2-bar loop — the "here comes the drop" cue
        if(s === 28){ noiseBurst(0.34, {gain:0.17, filterFreq:400, filterFreqEnd:8000}); }
        if(s === 30){ tone(rootFreq*4, 0.16, {type:'triangle', gain:0.05, glideTo:rootFreq*8}); } // softer, single sweep (was two harsh square-wave zaps)
        bgmStep++;
      }, stepMs);
    },
    restartBGMForSet(missionIdx){
      // called at the start of each set — cycles the melody/root so every
      // set has a slightly different tune, without needing separate audio files
      const wasIntensified = currentBGMIntensified;
      this.stopBGM();
      this.startBGM(wasIntensified, missionIdx);
    },
    restartBGMIntensified(){
      currentBGMIntensified = true;
      this.stopBGM();
      this.startBGM(true, currentBGMVariant);
    },
    markIntensified(){ currentBGMIntensified = true; },
    setBGMIntensity(isBoss){ bgmBoss = isBoss; },
    stopBGM(){
      if(bgmInterval){ clearInterval(bgmInterval); bgmInterval = null; }
    }
  };
})();
