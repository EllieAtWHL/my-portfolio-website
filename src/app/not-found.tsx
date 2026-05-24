'use client';

import Link from 'next/link';
import { Button } from '@/components/Button';
import { useState, useRef, useEffect } from 'react';

export default function NotFound() {
  const [score, setScore] = useState(0);
  const [ballsRemaining, setBallsRemaining] = useState(10);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 50, z: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const [showGoal, setShowGoal] = useState(false);
  const [showBullseye, setShowBullseye] = useState(false);
  const [showMiss, setShowMiss] = useState(false);
  const [missReason, setMissReason] = useState('');
  const [targetPosition, setTargetPosition] = useState({ x: 50, y: 10, z: 15 });
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false);
  const [isIntroPlaying, setIsIntroPlaying] = useState(false);
  const ballRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const isDraggingRef = useRef(false);
  const isTooFastRef = useRef(false);
  const ballWentThroughGoalRef = useRef(false);
  const scoreRef = useRef(0);

  const randomizeTarget = () => {
    // Random position within goal area (x: 20-80%, y: 5-18%, z: 10-25%)
    const newX = 20 + Math.random() * 60;
    const newY = 5 + Math.random() * 13;
    const newZ = 10 + Math.random() * 15;
    setTargetPosition({ x: newX, y: newY, z: newZ });
  };

  const randomizeBallPosition = () => {
    // Random position in lower area, well above text (x: 20-80%, y: 75-90%, z: 0)
    const newX = 20 + Math.random() * 60;
    const newY = 50 + Math.random() * 20;
    setBallPosition({ x: newX, y: newY, z: 0 });
  };

  const resetGame = () => {
    setScore(0);
    setBallsRemaining(10);
    setGameOver(false);
    randomizeBallPosition();
    randomizeTarget();
  };

  // Keep scoreRef in sync with score state
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // Load high score from localStorage on mount
  useEffect(() => {
    const savedHighScore = localStorage.getItem('footballHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  // Randomize ball position on initial load
  useEffect(() => {
    randomizeBallPosition();
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isFlying || isIntroPlaying) return;
    setIsDragging(true);
    isDraggingRef.current = true;
    isTooFastRef.current = false;
    ballWentThroughGoalRef.current = false;
    
    // Store in closure variables for immediate access
    const startX = e.clientX;
    const startY = e.clientY;
    const startBallX = ballPosition.x;
    const startBallY = ballPosition.y;
    
    const handleMouseMoveLocal = (e: MouseEvent) => {
      if (!isDraggingRef.current || isFlying) return;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      setBallPosition({ x: startBallX + deltaX / 10, y: startBallY + deltaY / 10, z: 0 });
    };
    
    const handleMouseUpLocal = (e: MouseEvent) => {
      if (!isDraggingRef.current || isFlying) return;
      setIsDragging(false);
      isDraggingRef.current = false;
      
      document.removeEventListener('mouseup', handleMouseUpLocal);
      document.removeEventListener('mousemove', handleMouseMoveLocal);
      
      setBallPosition({ x: 50, y: 50, z: 0 });
      
      const dragDeltaX = e.clientX - startX;
      const dragDeltaY = e.clientY - startY;
      const dragDistance = Math.sqrt(dragDeltaX * dragDeltaX + dragDeltaY * dragDeltaY);
      
      const zVelocity = Math.min(dragDistance * 0.15, 25);
      
      // Cap velocity to prevent automatic misses from too-fast kicks
      const maxVelocity = 30;
      let xVelocity = -dragDeltaX / 3;
      let yVelocity = -dragDeltaY / 3;
      
      // Calculate total velocity magnitude
      const velocityMagnitude = Math.sqrt(xVelocity * xVelocity + yVelocity * yVelocity + zVelocity * zVelocity);
      
      // Scale down if velocity is too high and show miss message
      if (velocityMagnitude > maxVelocity) {
        const scale = maxVelocity / velocityMagnitude;
        xVelocity *= scale;
        yVelocity *= scale;
        isTooFastRef.current = true;
        setShowMiss(true);
        setMissReason('High!');
        setTimeout(() => {
          setShowMiss(false);
          setMissReason('');
        }, 1000);
      } else {
        isTooFastRef.current = false;
      }
      
      const newVelocity = {
        x: xVelocity,
        y: yVelocity,
        z: zVelocity
      };
      
      setIsFlying(true);
      animateBall(newVelocity);
    };
    
    document.addEventListener('mouseup', handleMouseUpLocal);
    document.addEventListener('mousemove', handleMouseMoveLocal);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isFlying || isIntroPlaying) return;
    e.preventDefault();
    setIsDragging(true);
    isDraggingRef.current = true;
    isTooFastRef.current = false;
    ballWentThroughGoalRef.current = false;
    const touch = e.touches[0];
    
    // Store in closure variables for immediate access
    const startX = touch.clientX;
    const startY = touch.clientY;
    const startBallX = ballPosition.x;
    const startBallY = ballPosition.y;
    
    const handleTouchMoveLocal = (e: TouchEvent) => {
      if (!isDraggingRef.current || isFlying) return;
      e.preventDefault();
      const touch = e.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      setBallPosition({ x: startBallX + deltaX / 10, y: startBallY + deltaY / 10, z: 0 });
    };
    
    const handleTouchEndLocal = (e: TouchEvent) => {
      if (!isDraggingRef.current || isFlying) return;
      setIsDragging(false);
      isDraggingRef.current = false;
      
      document.removeEventListener('touchend', handleTouchEndLocal);
      document.removeEventListener('touchmove', handleTouchMoveLocal);
      
      setBallPosition({ x: 50, y: 50, z: 0 });
      
      const touch = e.changedTouches[0];
      const dragDeltaX = touch.clientX - startX;
      const dragDeltaY = touch.clientY - startY;
      const dragDistance = Math.sqrt(dragDeltaX * dragDeltaX + dragDeltaY * dragDeltaY);
      
      const zVelocity = Math.min(dragDistance * 0.15, 25);
      
      // Cap velocity to prevent automatic misses from too-fast kicks
      const maxVelocity = 30;
      let xVelocity = -dragDeltaX / 3;
      let yVelocity = -dragDeltaY / 3;
      
      // Calculate total velocity magnitude
      const velocityMagnitude = Math.sqrt(xVelocity * xVelocity + yVelocity * yVelocity + zVelocity * zVelocity);
      
      // Scale down if velocity is too high and show miss message
      if (velocityMagnitude > maxVelocity) {
        const scale = maxVelocity / velocityMagnitude;
        xVelocity *= scale;
        yVelocity *= scale;
        isTooFastRef.current = true;
        setShowMiss(true);
        setMissReason('High!');
        setTimeout(() => {
          setShowMiss(false);
          setMissReason('');
        }, 1000);
      } else {
        isTooFastRef.current = false;
      }
      
      const newVelocity = {
        x: xVelocity,
        y: yVelocity,
        z: zVelocity
      };
      
      setIsFlying(true);
      animateBall(newVelocity);
    };
    
    document.addEventListener('touchend', handleTouchEndLocal);
    document.addEventListener('touchmove', handleTouchMoveLocal);
  };

  const animateBall = (initialVelocity: { x: number; y: number; z: number }) => {
    let currentX = ballPosition.x;
    let currentY = ballPosition.y;
    let currentZ = ballPosition.z;
    const currentVx = initialVelocity.x;
    let currentVy = initialVelocity.y;
    let currentVz = initialVelocity.z;
    let goalChecked = false;

    const animate = () => {
      currentX += currentVx * 0.15;
      currentY += currentVy * 0.15;
      currentZ += currentVz * 0.15;
      currentVy += 0.08;
      currentVz -= 0.02;

      // Check for bullseye (target) hit - smaller zone around target position
      const targetHitbox = 15; // 15% margin around target (increased for easier hitting)
      if (!goalChecked && !isTooFastRef.current && 
          currentX > targetPosition.x - targetHitbox && 
          currentX < targetPosition.x + targetHitbox && 
          currentY > targetPosition.y - targetHitbox && 
          currentY < targetPosition.y + targetHitbox && 
          currentZ > targetPosition.z - targetHitbox && 
          currentZ < targetPosition.z + targetHitbox) {
        goalChecked = true;
        setScore(prev => prev + 5);
        setShowBullseye(true);
        setTimeout(() => setShowBullseye(false), 1000);
      }
      // Check for regular goal hit
      else if (!goalChecked && !isTooFastRef.current && currentX > 10 && currentX < 90 && currentY < 20 && currentY > 0 && currentZ > 5 && currentZ < 30) {
        goalChecked = true;
        setScore(prev => prev + 1);
        setShowGoal(true);
        setTimeout(() => setShowGoal(false), 1000);
      }

      // Track if ball went through goal area (for miss message)
      if (currentX > 10 && currentX < 90 && currentY < 20 && currentY > 0 && currentZ > 5 && currentZ < 30) {
        ballWentThroughGoalRef.current = true;
      }

      if (currentX < -20 || currentX > 120 || currentY > 120 || currentZ < -50 || currentZ > 100) {
        setIsFlying(false);
        setIsDragging(false);
        
        // Decrement balls remaining
        setBallsRemaining(prev => {
          const newRemaining = prev - 1;
          
          // Check if game is over
          if (newRemaining === 0) {
            setGameOver(true);
            // Update high score if current score is higher (use ref for latest value)
            if (scoreRef.current > highScore) {
              const newHighScore = scoreRef.current;
              setHighScore(newHighScore);
              localStorage.setItem('footballHighScore', newHighScore.toString());
            }
          }
          
          return newRemaining;
        });
        
        // Randomize target and ball position for next shot
        randomizeTarget();
        randomizeBallPosition();
        
        // Show miss message if not a goal and not too fast
        if (!showGoal && !isTooFastRef.current && !ballWentThroughGoalRef.current) {
          setShowMiss(true);
          setMissReason('Wide!');
          setTimeout(() => {
            setShowMiss(false);
            setMissReason('');
          }, 1000);
        }
        return;
      }

      setBallPosition({ x: currentX, y: currentY, z: currentZ });
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (hasPlayedIntro) return;
    
    setHasPlayedIntro(true);
    setIsIntroPlaying(true);
    
    const isLeft = Math.random() < 0.5;
    const startX = isLeft ? 15 : 85;
    
    setBallPosition({ x: startX, y: 25, z: 0 });
    
    let currentX = startX;
    let currentY = 25;
    let velocityX = (50 - startX) * 0.01;
    let velocityY = 0;
    let bounces = 0;
    
    const animateIntro = () => {
      velocityY += 0.3;
      currentX += velocityX;
      currentY += velocityY;
      
      if (currentY > 42 && velocityY > 0 && bounces < 1) {
        velocityY = -velocityY * 0.4;
        velocityX *= 0.9;
        bounces++;
      }
      
      if (currentY >= 50) {
        currentY = 50;
        velocityY = 0;
        velocityX = 0;
        setBallPosition({ x: currentX, y: currentY, z: 0 });
        setIsIntroPlaying(false);
        return;
      }
      
      setBallPosition({ x: currentX, y: currentY, z: 0 });
      animationRef.current = requestAnimationFrame(animateIntro);
    };
    
    setTimeout(() => {
      animationRef.current = requestAnimationFrame(animateIntro);
    }, 500);
  }, [hasPlayedIntro]);

  return (
    <div className="not-found-container">
      <div className="goal-post">
        <div className="post left-post"></div>
        <div className="crossbar"></div>
        <div className="post right-post"></div>
        <div className="net"></div>
        <div 
          className="target"
          style={{
            left: `${targetPosition.x}%`,
            top: `${targetPosition.y}%`,
            transform: `translate(-50%, -50%) scale(${1 + targetPosition.z * 0.02})`
          }}
        ></div>
        {showGoal && <div className="goal-message">GOAL!</div>}
        {showBullseye && <div className="bullseye-message">BULLSEYE! +5</div>}
        {showMiss && <div className="miss-message">MISS - {missReason}</div>}
      </div>
      
      <div 
        ref={ballRef}
        className={`football ${isDragging ? 'dragging' : ''} ${isFlying ? 'flying' : ''}`}
        style={{
          left: `${ballPosition.x}%`,
          top: `${ballPosition.y}%`,
          transform: `translate(-50%, -50%) scale(${1 + ballPosition.z * 0.01})`,
          zIndex: Math.max(20, Math.floor(ballPosition.z)),
          pointerEvents: gameOver ? 'none' : 'auto'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        role="button"
        tabIndex={0}
        aria-label="Drag and release to kick the football"
      >
        ⚽
      </div>
      
      <div className="not-found-content">
        <div className="not-found-header">
          <h1 className="not-found-title">404</h1>
          <p className="not-found-subtitle">Page Not Found</p>
        </div>
        <p className="not-found-message">
          Looks like the ball hit the post! This page doesn&apos;t exist.
        </p>
      </div>
      
      <div className="not-found-content not-found-game-info">
        <p className="score-display">
          Goals scored: <span className="score-number">{score}</span>
        </p>
        <p className="score-display">
          Balls remaining: <span className="score-number">{ballsRemaining}</span>
        </p>
        <p className="score-display">
          High score: <span className="score-number">{highScore}</span>
        </p>
        <p className="game-hint">Drag the ball and release to flick it into the goal!</p>
        
        {gameOver && (
          <div style={{ marginTop: '1rem' }}>
            <p className="score-display" style={{ fontSize: '1.5rem', fontWeight: '700' }}>
              Game Over!
            </p>
            <Button 
              variant="primary" 
              size="lg" 
              onClick={resetGame}
              style={{ marginTop: '0.5rem' }}
            >
              Play Again
            </Button>
          </div>
        )}
        
        <Link href="/">
          <Button variant="secondary" size="lg" style={{ marginTop: '1rem' }}>
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
