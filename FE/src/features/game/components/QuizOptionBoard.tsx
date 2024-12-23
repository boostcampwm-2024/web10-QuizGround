import { usePlayerStore } from '@/features/game/data/store/usePlayerStore';
import { useRoomStore } from '@/features/game/data/store/useRoomStore';
import { useQuizStore } from '@/features/game/data/store/useQuizStore';
import { Player } from './Player';
import { socketService } from '@/api/socket';
import { useEffect, useRef, useState } from 'react';
import { getServerTimestamp } from '@/features/game/utils/serverTime';
// import PingEffect from './PingEffect';

const optionColors = [
  '#FF9AA2', // pastel red
  '#FFB3BA', // pastel pink
  '#FFDAC1', // pastel peach
  '#FFE156', // pastel yellow
  '#E2F0CB', // pastel green
  '#B5EAD7', // pastel mint
  '#C7CEEA', // pastel blue
  '#A0C4FF', // pastel light blue
  '#B9D8FF', // pastel lavender
  '#C3B3E0' // pastel purple
];

export const QuizOptionBoard = () => {
  const currentPlayerId = usePlayerStore((state) => state.currentPlayerId);
  const gameId = useRoomStore((state) => state.gameId);
  const players = usePlayerStore((state) => state.players);
  const currentQuiz = useQuizStore((state) => state.currentQuiz);
  const choiceList = currentQuiz?.choiceList || [];
  const quizState = useQuizStore((state) => state.quizState);
  const quizAnswer = useQuizStore((state) => state.currentAnswer);
  const [selectedOption, setSelectedOption] = useState(currentQuiz?.choiceList.length);
  const [choiceListVisible, setChoiceListVisible] = useState(false);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [boardRect, setBoardRect] = useState<null | DOMRect>(null);
  const [isWarningMove, setIsWarningMove] = useState(false);

  // 보드 크기 초기화
  useEffect(() => {
    if (boardRef.current) {
      setBoardRect(boardRef.current.getBoundingClientRect());
    }
  }, []);

  // 화면 변화에 따라 보드 크기 재조정
  useEffect(() => {
    const handleResize = () => {
      if (boardRef.current) setBoardRect(boardRef.current.getBoundingClientRect());
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [boardRef]);

  // 퀴즈 시작 시간에 선택지 렌더링
  useEffect(() => {
    setChoiceListVisible(false);
    const interval = setInterval(() => {
      if (currentQuiz && currentQuiz.startTime <= getServerTimestamp()) {
        setChoiceListVisible(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [currentQuiz]);

  const handleMove = (pageX: number, pageY: number) => {
    const currentPlayer = players.get(currentPlayerId);
    if (!currentPlayer || !currentPlayer.isAlive) {
      setIsWarningMove(true);
      return;
    }
    if (!boardRect) return;
    const { width, height, top, left } = boardRect;
    const x = (pageX - left - window.scrollX) / width;
    const y = (pageY - top - window.scrollY) / height;
    if (x > 1 || y > 1 || x < 0 || y < 0) return;
    socketService.emit('updatePosition', { gameId, newPosition: [y, x] });
    const option = Math.round(x) + Math.floor(y * Math.ceil(choiceList.length / 2)) * 2;
    setSelectedOption(option);
  };

  // 경고 문구 2초뒤 끄기
  useEffect(() => {
    let timeout = null;
    if (isWarningMove) timeout = setTimeout(() => setIsWarningMove(false), 2000);
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isWarningMove]);

  const handleClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const { pageX, pageY } = e;
    handleMove(pageX, pageY);
  };

  const handleTouchEnd: React.TouchEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    const { pageX, pageY } = e.changedTouches[0];
    handleMove(pageX, pageY);
  };

  return (
    <div
      className="relative component-default h-[100%] select-none "
      onClick={handleClick}
      onTouchEnd={handleTouchEnd}
      ref={boardRef}
    >
      <div className="absolute h-[100%] w-[100%]">
        {boardRect
          ? Array.from(players)
              .filter(([, player]) => player.isAlive)
              .map(([, player]) => {
                return (
                  <Player
                    key={player.playerId}
                    playerId={player.playerId}
                    boardSize={[boardRect.width, boardRect.height]}
                    isCurrent={player.playerId === currentPlayerId}
                  />
                );
              })
          : null}
      </div>
      {isWarningMove && (
        <div className="absolute w-[100%] h-[100%] flex justify-center items-center z-20">
          <div className="bg-gray-400 rounded-2xl p-4 opacity-50 text-white">
            탈락하여 움직일 수 없습니다
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 p-4 h-[100%] w-[100%]">
        {choiceListVisible &&
          choiceList.map((option, i) => (
            <div
              className={'rounded-lg relative w-[100%] h-[100%] overflow-hidden'}
              key={i}
              style={{
                background: optionColors[i],
                border: 'solid 3px ' + (i === selectedOption ? 'lightgreen' : 'white'),
                boxShadow:
                  quizState === 'end' && option.order == quizAnswer
                    ? `
      0 0 10px rgba(255, 215, 0, 0.8), 
      0 0 20px rgba(255, 223, 0, 0.6), 
      0 0 30px rgba(255, 223, 0, 0.5), 
      0 0 40px rgba(255, 215, 0, 0.4)`
                    : 'none',
                opacity: quizState === 'end' && option.order != quizAnswer ? '0.3' : '1',
                textShadow: '-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white'
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-center z-10 font-bold text-3xl text-black break-all p-4">
                {option.content}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
