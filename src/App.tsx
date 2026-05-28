import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, useSpring, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { X, Send, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import './App.css';

// --- Sub-components ---

const FilmGrain = () => (
  <div className="pointer-events-none absolute inset-0 z-50 opacity-[0.12] mix-blend-overlay">
    <svg width="100%" height="100%">
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.5 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)" />
    </svg>
  </div>
);

const TechnicalPattern = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="industrialGrid" width="400" height="400" patternUnits="userSpaceOnUse">
          <circle cx="200" cy="200" r="180" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="4,8" />
          <circle cx="200" cy="200" r="120" fill="none" stroke="white" strokeWidth="0.5" />
          <circle cx="200" cy="200" r="60" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="1,2" />
          <line x1="200" y1="20" x2="200" y2="380" stroke="white" strokeWidth="0.3" />
          <line x1="20" y1="200" x2="380" y2="200" stroke="white" strokeWidth="0.3" />
          <path d="M0,20 L0,-20 M20,0 L-20,0" transform="translate(10,10)" stroke="white" strokeWidth="0.5" />
          <path d="M0,20 L0,-20 M20,0 L-20,0" transform="translate(390,10)" stroke="white" strokeWidth="0.5" />
          <path d="M0,20 L0,-20 M20,0 L-20,0" transform="translate(10,390)" stroke="white" strokeWidth="0.5" />
          <path d="M0,20 L0,-20 M20,0 L-20,0" transform="translate(390,390)" stroke="white" strokeWidth="0.5" />
          <rect x="195" y="10" width="10" height="1" fill="white" />
          <rect x="195" y="389" width="10" height="1" fill="white" />
          <rect x="10" y="195" width="1" height="10" fill="white" />
          <rect x="389" y="195" width="1" height="10" fill="white" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#industrialGrid)" />
    </svg>
  </div>
);

const CraneGeometry = () => {
  const vertices = useMemo(() => new Float32Array([
    0, -0.2, 0,       // 0: Body Bottom
    0, 0.4, 0,        // 1: Body Top
    1.8, 0.5, 0,      // 2: Right Wing Tip
    -1.8, 0.5, 0,     // 3: Left Wing Tip
    0, 0.1, 0.8,      // 4: Body Front
    0, 0.1, -0.8,     // 5: Body Back
    0, 1.2, -1.8,     // 6: Tail Tip
    0, 1.2, 1.6,      // 7: Neck Tip
    0, 0.9, 1.9       // 8: Head Beak
  ]), []);

  const indices = useMemo(() => new Uint16Array([
    1, 2, 4,  1, 5, 2,  0, 4, 2,  0, 2, 5, // Right Wing
    1, 4, 3,  1, 3, 5,  0, 3, 4,  0, 5, 3, // Left Wing
    1, 5, 6,  0, 6, 5,                     // Tail
    1, 7, 4,  0, 4, 7,                     // Neck
    7, 8, 4                                // Head
  ]), []);

  return (
    <bufferGeometry>
      <bufferAttribute attach="attributes-position" args={[vertices, 3]} />
      <bufferAttribute attach="index" args={[indices, 1]} />
    </bufferGeometry>
  );
};

const Bird3D = ({ position, rotation, scale, speed, isLightning }: any) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime() * speed;
    meshRef.current.rotation.y = Math.sin(t * 0.5) * 0.2 + rotation[1];
    meshRef.current.position.y += Math.sin(t) * 0.005;
    
    const flap = Math.sin(t * 2) * 0.15;
    meshRef.current.scale.x = scale * (1 + flap);
  });

  return (
    <Float speed={2 * speed} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position} rotation={rotation} scale={scale}>
        <CraneGeometry />
        <meshStandardMaterial 
          color={isLightning ? "#ff0000" : "#ffffff"} 
          wireframe={true}
          transparent={true}
          opacity={isLightning ? 0.9 : 0.15}
          emissive={isLightning ? "#ff0000" : "#000000"}
          emissiveIntensity={isLightning ? 4 : 0}
          side={THREE.DoubleSide}
        />
      </mesh>
    </Float>
  );
};

const Scene3D = ({ isLightning, mouseX, mouseY }: any) => {
  const { viewport } = useThree();
  const birdPositions = useMemo(() => [
    { pos: [-viewport.width * 0.35, viewport.height * 0.2, 0], rot: [0.2, 0.5, 0], scale: 0.8, speed: 0.8 },
    { pos: [viewport.width * 0.35, viewport.height * 0.15, -2], rot: [-0.1, -0.4, 0.1], scale: 0.6, speed: 1.2 },
    { pos: [viewport.width * 0.2, -viewport.height * 0.25, 2], rot: [0.4, 0.2, -0.2], scale: 1.1, speed: 0.7 },
    { pos: [-viewport.width * 0.3, -viewport.height * 0.2, -1], rot: [-0.3, 0.8, 0.1], scale: 0.5, speed: 1.5 },
  ], [viewport]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={35} />
      <ambientLight intensity={isLightning ? 0.8 : 0.1} color={isLightning ? "#ff0000" : "#ffffff"} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={isLightning ? 20 : 1} color={isLightning ? "#ff0033" : "#ffffff"} />
      <pointLight position={[-10, -10, -10]} intensity={isLightning ? 15 : 0.5} color={isLightning ? "#00ffff" : "#ffffff"} />
      
      {/* @ts-ignore */}
      <motion.group
        animate={{ 
          x: mouseX.get() * 0.005,
          y: -mouseY.get() * 0.005,
          rotateY: mouseX.get() * 0.0005,
          rotateX: -mouseY.get() * 0.0005,
        }}
      >
        {birdPositions.map((bird, i) => (
          <Bird3D key={i} position={bird.pos} rotation={bird.rot} scale={bird.scale} speed={bird.speed} isLightning={isLightning} />
        ))}
      {/* @ts-ignore */}
      </motion.group>

      <Environment preset="night" />
      <ContactShadows position={[0, -5, 0]} opacity={0.3} scale={20} blur={3} far={4.5} />
    </>
  );
};

const TechnicalLabel = ({ text, position, className = "" }: { text: string, position: string, className?: string }) => (
  <div className={`absolute font-mono text-[6px] md:text-[8px] tracking-[0.3em] md:tracking-[0.5em] text-white/15 uppercase pointer-events-none select-none ${position} ${className}`}>
    {text}
  </div>
);

const InteractiveButton = ({ onClick, children, className = "", isExternal = false, href = "" }: { onClick?: () => void, children: React.ReactNode, className?: string, isExternal?: boolean, href?: string }) => {
  const btnRef = useRef<HTMLDivElement>(null);
  const [localMouse, setLocalMouse] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setLocalMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const Content = (
    <div 
      ref={btnRef}
      onMouseMove={handleMouseMove}
      className={`group relative overflow-hidden px-8 md:px-12 py-3 border border-white/5 transition-all duration-500 hover:border-white/20 cursor-pointer ${className}`}
      onClick={onClick}
    >
      <motion.div 
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{ background: `radial-gradient(circle 80px at ${localMouse.x}px ${localMouse.y}px, rgba(255,255,255,0.08), transparent)` }}
      />
      <span className="relative z-10 text-[7px] md:text-[8px] font-mono tracking-[0.4em] uppercase transition-colors group-hover:text-white/80">
        {children}
      </span>
    </div>
  );

  if (isExternal) return <a href={href} target="_blank" rel="noopener noreferrer" className="block">{Content}</a>;
  return Content;
};

const ContactModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');
    
    const form = e.currentTarget;
    const formData = new FormData(form);

    const body = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      body.append(key, value.toString());
    }

    // POST to "/" or "/index.html" often 404s with SPA `/* -> /index.html` + Pretty URLs.
    // POST to this dedicated static file path (shadowed from the catch-all) so Netlify Forms receives it.
    const formAction = new URL(
      "netlify-form-contact.html",
      `${window.location.origin}${import.meta.env.BASE_URL}`,
    ).pathname;

    try {
      const response = await fetch(formAction, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      
      if (response.ok) {
        setStatus('success');
        setTimeout(() => {
          onClose();
          setStatus('idle');
        }, 2000);
      } else {
        const errorText = await response.text();
        console.error("Netlify response error:", errorText);
        setStatus('error');
      }
    } catch (error) {
      console.error("Form fetch error:", error);
      setStatus('error');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/95 backdrop-blur-3xl" />
          <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }} className="relative w-full max-w-lg bg-black border border-white/10 p-10 md:p-16 my-auto shadow-2xl">
            <div className="relative z-10 text-white">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <h2 className="text-lg md:text-xl font-bold tracking-[0.4em] uppercase mb-1">
                    {status === 'success' ? 'Transmission Complete' : status === 'error' ? 'Transmission Failed' : 'Contact'}
                  </h2>
                  <p className="font-mono text-[8px] text-white/20 tracking-[0.4em] uppercase">
                    {status === 'success' ? 'Message received successfully.' : status === 'error' ? 'Please retry connection.' : 'Established connection...'}
                  </p>
                </div>
                <button onClick={onClose} className="p-2 -mr-2 text-white/20 hover:text-white transition-colors"><X size={16} /></button>
              </div>

              {status === 'success' ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center py-10 gap-4">
                  <CheckCircle size={40} className="text-white/40" />
                  <p className="font-mono text-[10px] tracking-widest text-white/40 uppercase">Closing Secure Channel...</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} name="contact" data-netlify="true" netlify-honeypot="bot-field" className="space-y-10">
                  <input type="hidden" name="form-name" value="contact" />
                  <input type="hidden" name="subject" value="SHADY WORLDWIDE - New contact (%{submissionId})" data-remove-prefix />
                  <p className="hidden">
                    <label>Don't fill this out if you're human: <input name="bot-field" /></label>
                  </p>
                  <div className="space-y-4 group">
                    <label className="block font-mono text-[8px] text-white/30 tracking-widest uppercase">Identity</label>
                    <input required name="name" type="text" placeholder="NAME" className="w-full bg-transparent border-b border-white/5 py-2 font-mono text-xs focus:outline-none focus:border-white/30 transition-all placeholder:text-white/5" />
                  </div>
                  <div className="space-y-4 group">
                    <label className="block font-mono text-[8px] text-white/30 tracking-widest uppercase">Coordinates</label>
                    <input required name="email" type="email" placeholder="EMAIL" className="w-full bg-transparent border-b border-white/5 py-2 font-mono text-xs focus:outline-none focus:border-white/30 transition-all placeholder:text-white/5" />
                  </div>
                  <div className="space-y-4 group">
                    <label className="block font-mono text-[8px] text-white/30 tracking-widest uppercase">Transmission</label>
                    <textarea required name="message" rows={3} placeholder="MESSAGE..." className="w-full bg-transparent border border-white/5 p-4 font-mono text-xs focus:outline-none focus:border-white/30 transition-all placeholder:text-white/5 resize-none" />
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    {status === 'error' && (
                      <div className="flex items-center gap-2 text-red-500/60 font-mono text-[8px] uppercase tracking-widest">
                        <AlertCircle size={12} /> Connection error. Try again.
                      </div>
                    )}
                    <button 
                      disabled={status === 'submitting'}
                      type="submit" 
                      className="w-full group relative py-4 overflow-hidden border border-white/10 hover:border-white/30 transition-colors disabled:opacity-50"
                    >
                      <span className="relative z-10 text-[9px] font-mono tracking-[0.6em] uppercase transition-colors group-hover:text-white flex items-center justify-center gap-3">
                        {status === 'submitting' ? 'Transmitting...' : 'Send'} <Send size={10} />
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// --- Main Application ---

export default function App() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [lightningState, setLightningState] = useState<'idle' | 'flashing'>('idle');
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springX = useSpring(mouseX, { stiffness: 15, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 15, damping: 25 });

  const gridRotateX = useTransform(springY, [-500, 500], [66, 54]);
  const gridRotateY = useTransform(springX, [-500, 500], [-5, 5]);
  
  const contentX = useTransform(springX, [-500, 500], [-8, 8]);
  const contentY = useTransform(springY, [-500, 500], [-10, 10]);
  
  const pageRotateX = useTransform(springY, [-500, 500], [4, -4]);
  const pageRotateY = useTransform(springX, [-500, 500], [-4, 4]);

  const triggerLightning = useCallback(() => {
    const numBursts = 3 + Math.floor(Math.random() * 4);
    let delay = 0;
    for (let i = 0; i < numBursts; i++) {
      setTimeout(() => setLightningState('flashing'), delay);
      setTimeout(() => setLightningState('idle'), delay + 20 + Math.random() * 60);
      delay += 50 + Math.random() * 120;
    }
    const nextStrike = Math.random() * 12000 + 8000;
    setTimeout(triggerLightning, nextStrike);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = ((clientX / innerWidth) - 0.5) * 1000;
      const y = ((clientY / innerHeight) - 0.5) * 1000;
      mouseX.set(x);
      mouseY.set(y);
    };
    window.addEventListener('mousemove', handleMouseMove);
    const initialDelay = 5000;
    const timer = setTimeout(triggerLightning, initialDelay);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timer);
    };
  }, [mouseX, mouseY, triggerLightning]);

  const isLightning = lightningState === 'flashing';

  return (
    <div className="fixed inset-0 bg-black text-white selection:bg-white selection:text-black font-sans overflow-hidden touch-none">
      
      <FilmGrain />
      {isLightning && (
        <div className="absolute inset-0 z-40 bg-white mix-blend-difference pointer-events-none opacity-80" />
      )}
      {isLightning && (
        <div className="absolute inset-0 z-40 bg-red-600 mix-blend-color pointer-events-none opacity-30" />
      )}
      
      <TechnicalPattern />

      {/* Volumetric 3D Line Grid Background */}
      <div className="absolute inset-0 perspective-grid pointer-events-none flex items-center justify-center">
        <motion.div 
          style={{ rotateX: gridRotateX, rotateY: gridRotateY }} 
          animate={{ opacity: isLightning ? 0.3 : 0.1 }}
          transition={{ duration: 0.2 }}
          className="relative w-[400vw] h-[400vh] flex items-center justify-center"
        >
          <div className="absolute inset-0 grid-plane" />
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="absolute w-[1px] bg-white/5 h-full origin-center" style={{ left: `${(i + 1) * 8}%`, transform: 'rotateY(90deg)' }} />
            ))}
            {[...Array(12)].map((_, i) => (
              <div key={i} className="absolute h-[1px] bg-white/5 w-full origin-center" style={{ top: `${(i + 1) * 8}%`, transform: 'rotateX(90deg)' }} />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Blueprint Construction Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="absolute top-0 bottom-0 left-1/4 w-[1px] bg-white/10" />
        <div className="absolute top-0 bottom-0 right-1/4 w-[1px] bg-white/10" />
        <div className="absolute left-0 right-0 top-1/4 h-[1px] bg-white/10" />
        <div className="absolute left-0 right-0 bottom-1/4 h-[1px] bg-white/10" />
      </div>

      <TechnicalLabel text="EST. 2026" position="top-8 left-8" />
      <TechnicalLabel text="NYC / WORLDWIDE" position="top-8 right-8" />
      <TechnicalLabel text="SYSTEM ONLINE" position="bottom-8 left-8" />
      <TechnicalLabel text="VISUAL ENGINEERING" position="bottom-8 right-8" />
      
      <div className="absolute inset-0 z-10 pointer-events-none">
        <Canvas dpr={[1, 2]} gl={{ antialias: true }}>
          <Scene3D isLightning={isLightning} mouseX={mouseX} mouseY={mouseY} />
        </Canvas>
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-6" style={{ perspective: '1000px' }}>
        <motion.main 
          style={{ 
            x: contentX, 
            y: contentY,
            rotateX: pageRotateX,
            rotateY: pageRotateY,
            transformStyle: "preserve-3d"
          }} 
          className="flex flex-col items-center gap-10 w-full max-w-4xl pointer-events-auto"
        >
          <div className="relative group cursor-default flex flex-col items-center">
            <motion.h1 
              animate={{ 
                opacity: isLightning ? [0.6, 1, 0.6] : 1,
                textShadow: isLightning ? "0 0 40px rgba(255,255,255,0.2)" : "0 0 0px rgba(255,255,255,0)"
              }}
              transition={{ duration: 0.1 }}
              className={`text-lg xs:text-xl md:text-2xl lg:text-3xl font-bold tracking-[0.8em] md:tracking-[1.2em] text-center leading-none md:whitespace-nowrap uppercase text-white/90 glitch-text ${isLightning ? 'glitch-active' : ''}`}
              data-text="SHADY WORLDWIDE"
            >
              SHADY WORLDWIDE
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 0.6 }} 
              transition={{ delay: 1 }} 
              className="mt-6 md:mt-8 text-[6px] md:text-[8px] font-mono tracking-[0.4em] md:tracking-[0.6em] text-white/80 max-w-xs md:max-w-lg text-center uppercase leading-loose"
            >
              Design systems, interfaces, experiments, <br className="hidden xs:block" /> and engineered visual culture.
            </motion.p>
          </div>

          <div className="flex flex-col sm:flex-row gap-8 sm:gap-14 w-full sm:w-auto">
            <InteractiveButton onClick={() => setIsContactOpen(true)}>Contact</InteractiveButton>
            <InteractiveButton isExternal href="https://www.mattshade.com/">View Work <ArrowRight size={8} className="ml-2 inline hidden sm:inline opacity-30" /></InteractiveButton>
          </div>
        </motion.main>
      </div>

      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </div>
  );
}
