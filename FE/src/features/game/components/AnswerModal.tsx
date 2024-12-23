import lottie from 'lottie-web';
import AnswerBg from '@/assets/lottie/congrats.json';
import { useEffect, useState, useRef } from 'react';
import { usePlayerStore } from '../data/store/usePlayerStore';

type AnswerModalProps = {
  isOpen: boolean;
};

const AnswerModal: React.FC<AnswerModalProps> = ({ isOpen }) => {
  const [countdown, setCountdown] = useState(3);
  const isAnswer = usePlayerStore((state) => state.players.get(state.currentPlayerId)?.isAnswer);
  const isAlive = usePlayerStore((state) => state.players.get(state.currentPlayerId)?.isAlive);

  useEffect(() => {
    if (isOpen) {
      setCountdown(3);
      const interval = setInterval(() => {
        setCountdown((prev: number) => {
          if (prev === 1) {
            clearInterval(interval);
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const effectRef = useRef(null);

  useEffect(() => {
    if (isOpen && effectRef.current) {
      const animation = lottie.loadAnimation({
        container: effectRef.current,
        renderer: 'canvas',
        loop: true,
        autoplay: true,
        animationData: AnswerBg
      });

      const timer = setTimeout(() => {
        animation.stop();
      }, 3000);

      return () => {
        animation.destroy();
        clearTimeout(timer);
      };
    }
  }, [isOpen]);

  if (!isOpen || countdown <= 0) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-25 z-50 pointer-events-none">
      {isAnswer && (
        <div
          ref={effectRef}
          className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none"
          style={{
            transform: 'scale(1.15)',
            minWidth: '100vw',
            minHeight: '100vh'
          }}
        />
      )}

      <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-4 p-8 text-6xl animate-popup">
        {!isAlive ? (
          <p className="text-green-500 [text-shadow:_0_0_4px_white]">정답 발표</p>
        ) : isAnswer ? (
          <p className="text-green-500 [text-shadow:_0_0_4px_white]">정답입니다</p>
        ) : (
          <p className="text-red-500 [text-shadow:_0_0_4px_black]">틀렸습니다</p>
        )}
      </div>
    </div>
  );
};
export default AnswerModal;
