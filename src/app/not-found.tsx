'use client';

import Link from 'next/link';
import { Button } from '@/components/Button';
import { useState, useRef, useEffect } from 'react';

export default function NotFound() {
  const [score, setScore] = useState(0);
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 50, z: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const [showGoal, setShowGoal] = useState(false);
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false);
  const [isIntroPlaying, setIsIntroPlaying] = useState(false);
  const ballRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const isDraggingRef = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isFlying || isIntroPlaying) return;
    setIsDragging(true);
    isDraggingRef.current = true;
    
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
      
      const newVelocity = {
        x: -dragDeltaX / 3,
        y: -dragDeltaY / 3,
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
      
      const newVelocity = {
        x: -dragDeltaX / 3,
        y: -dragDeltaY / 3,
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

      if (!goalChecked && currentX > 10 && currentX < 90 && currentY < 20 && currentY > 0 && currentZ > 5 && currentZ < 30) {
        goalChecked = true;
        setScore(prev => prev + 1);
        setShowGoal(true);
        setTimeout(() => setShowGoal(false), 1000);
      }

      if (currentX < -20 || currentX > 120 || currentY > 120 || currentZ < -50 || currentZ > 100) {
        setBallPosition({ x: 50, y: 50, z: 0 });
        setIsFlying(false);
        setIsDragging(false);
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
        {showGoal && <div className="goal-message">GOAL!</div>}
      </div>
      
      <div 
        ref={ballRef}
        className={`football ${isDragging ? 'dragging' : ''} ${isFlying ? 'flying' : ''}`}
        style={{
          left: `${ballPosition.x}%`,
          top: `${ballPosition.y}%`,
          transform: `translate(-50%, -50%) scale(${1 + ballPosition.z * 0.01})`,
          zIndex: Math.floor(ballPosition.z)
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        role="button"
        tabIndex={0}
        aria-label="Drag and release to kick the football"
      >
        <div className="football-pattern"></div>
      </div>
      
      <div className="not-found-content">
        <div className="not-found-header">
          <h1 className="not-found-title">404</h1>
          <p className="not-found-subtitle">Page Not Found</p>
        </div>
        <p className="not-found-message">
          Looks like the ball hit the post! This page doesn&apos;t exist.
        </p>
        
        <p className="score-display">
          Goals scored: <span className="score-number">{score}</span>
        </p>
        <p className="game-hint">Drag the ball and release to flick it into the goal!</p>
        
        <Link href="/">
          <Button variant="primary" size="lg">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
