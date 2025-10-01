'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Player, Opponent, Boss, Shot, INITIAL_LIVES, RESPAWN_TIME_MS } from '@/lib/game-logic';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

type GameState = 'start' | 'playing' | 'respawning' | 'win' | 'gameOver';

export default function StarSquareShooter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const xDown = useRef<number | null>(null);

  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [player, setPlayer] = useState<Player | null>(null);
  const [opponent, setOpponent] = useState<Opponent | Boss | null>(null);
  const [playerShots, setPlayerShots] = useState<Shot[]>([]);
  const [opponentShots, setOpponentShots] = useState<Shot[]>([]);

  const gameOverImage = PlaceHolderImages.find(p => p.id === 'gameOver');
  const youWinImage = PlaceHolderImages.find(p => p.id === 'youWin');

  const removeOpponent = useCallback(() => {
    setScore(prevScore => prevScore + 1);
    const newOpponent = new Boss(GAME_WIDTH, GAME_HEIGHT);
    setOpponent(newOpponent);
  }, []);

  const endGame = useCallback((won: boolean) => {
    setGameState(won ? 'win' : 'gameOver');
  }, []);

  const startGame = useCallback(() => {
    const newPlayer = new Player(GAME_WIDTH, GAME_HEIGHT);
    const newOpponent = new Opponent(GAME_WIDTH, GAME_HEIGHT);
    setPlayer(newPlayer);
    setOpponent(newOpponent);
    setLives(INITIAL_LIVES);
    setScore(0);
    setPlayerShots([]);
    setOpponentShots([]);
    setGameState('playing');
  }, []);

  const handlePlayerDeath = useCallback(() => {
    if (!player) return;

    const isGameOver = player.loseLife();
    setLives(player.lives);

    if (isGameOver) {
      endGame(false);
    } else {
      setGameState('respawning');
      setTimeout(() => {
        player.respawn();
        setGameState('playing');
      }, RESPAWN_TIME_MS);
    }
  }, [player, endGame]);

  const gameLoop = useCallback(() => {
    if (!canvasRef.current || !player || !opponent) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Update player
    if (gameState === 'playing') {
      if (keysPressed.current['ArrowLeft'] || keysPressed.current['a']) player.x -= player.speed;
      if (keysPressed.current['ArrowRight'] || keysPressed.current['d']) player.x += player.speed;
      if (xDown.current !== null) {
          if (xDown.current < player.x + player.width / 2) {
              player.x -= player.speed;
          } else {
              player.x += player.speed;
          }
      }
      player.x = Math.max(0, Math.min(GAME_WIDTH - player.width, player.x));
      
      if (keysPressed.current[' '] || keysPressed.current['ArrowUp'] || keysPressed.current['w']) {
        if (Date.now() - player.lastShot > 500) {
          setPlayerShots(prev => [...prev, player.shoot()]);
        }
      }
    }
    player.draw(ctx);

    // Update opponent
    if (!opponent.dead) {
      opponent.update();
      if (Date.now() - opponent.lastShot > 2000) {
        setOpponentShots(prev => [...prev, opponent.shoot()]);
      }
    }
    opponent.draw(ctx);

    // Update shots
    setPlayerShots(prev => prev.filter(shot => {
      shot.update();
      return shot.y > 0;
    }));
    setOpponentShots(prev => prev.filter(shot => {
      shot.update();
      return shot.y < GAME_HEIGHT;
    }));

    // Draw shots
    playerShots.forEach(shot => shot.draw(ctx));
    opponentShots.forEach(shot => shot.draw(ctx));

    // Collision detection
    if(gameState === 'playing') {
      playerShots.forEach((shot, shotIndex) => {
        if (!opponent.dead && shot.isCollidingWith(opponent)) {
          opponent.collide();
          setPlayerShots(prev => prev.filter((_, i) => i !== shotIndex));
          setTimeout(() => {
            if (opponent instanceof Boss) {
              endGame(true);
            } else {
              removeOpponent();
            }
          }, 1000);
        }
      });
  
      opponentShots.forEach((shot, shotIndex) => {
        if (!player.dead && shot.isCollidingWith(player)) {
          setOpponentShots(prev => prev.filter((_, i) => i !== shotIndex));
          handlePlayerDeath();
        }
      });
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [player, opponent, playerShots, opponentShots, gameState, removeOpponent, endGame, handlePlayerDeath]);

  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameLoop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key] = false; };
    const handleTouchStart = (e: TouchEvent) => { xDown.current = e.touches[0].clientX; };
    const handleTouchEnd = () => { xDown.current = null; };
    const handleTouchMove = (e: TouchEvent) => { if (xDown.current) xDown.current = e.touches[0].clientX; };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  const renderGameStateOverlay = () => {
    const commonCardClasses = "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background/80 backdrop-blur-sm";

    switch (gameState) {
      case 'start':
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Card className={commonCardClasses}>
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-center text-primary font-headline">Star Square Shooter</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <p className="text-center text-muted-foreground">Use arrow keys or touch to move. Press space or up arrow to shoot.</p>
                <Button onClick={startGame} size="lg">Start Game</Button>
              </CardContent>
            </Card>
          </div>
        );
      case 'win':
      case 'gameOver':
        const image = gameState === 'win' ? youWinImage : gameOverImage;
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Card className={commonCardClasses}>
              <CardHeader>
                 <CardTitle className="text-4xl font-bold text-center text-primary font-headline">{gameState === 'win' ? 'You Win!' : 'Game Over'}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                 {image && <Image src={image.imageUrl} alt={image.description} width={400} height={300} data-ai-hint={image.imageHint} className="rounded-lg" />}
                <p className="text-xl text-center">Final Score: {score}</p>
                <Button onClick={startGame} size="lg">Play Again</Button>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background font-body p-4">
      <h1 className="text-4xl font-bold text-primary mb-4 font-headline">Star Square Shooter</h1>
      <div className="relative w-[800px] max-w-full aspect-[4/3] shadow-2xl shadow-primary/20 rounded-lg overflow-hidden border-2 border-primary/50">
        <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} className="w-full h-full" />
        <div className="absolute top-0 left-0 w-full p-4 pointer-events-none">
            <ul className="flex justify-between text-xl font-semibold text-accent font-headline">
                <li id="scoreli">Score: {score}</li>
                <li id="livesli">Lives: {lives}</li>
            </ul>
        </div>
        {renderGameStateOverlay()}
      </div>
       <div className="mt-4 text-center text-muted-foreground lg:hidden">
        <p>Use touch to move and tap the button to shoot.</p>
        <Button 
            className="mt-2"
            onTouchStart={() => { keysPressed.current[' '] = true; }}
            onTouchEnd={() => { keysPressed.current[' '] = false; }}
        >Shoot</Button>
      </div>
    </main>
  );
}
