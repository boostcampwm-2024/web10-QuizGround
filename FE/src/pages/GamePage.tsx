import Chat from '@/components/Chat';
import ParticipantDisplay from '@/components/ParticipantDisplay';
import { QuizOptionBoard } from '@/components/QuizOptionBoard';
import { Modal } from '../components/Modal';
import { useState, useEffect } from 'react';
import { GameHeader } from '@/components/GameHeader';
import { HeaderBar } from '@/components/HeaderBar';
import { socketService, useSocketException } from '@/api/socket';
import { useParams } from 'react-router-dom';
import { useRoomStore } from '@/store/useRoomStore';
import { QuizHeader } from '@/components/QuizHeader';
import GameState from '@/constants/gameState';
import { usePlayerStore } from '@/store/usePlayerStore';
import { ResultModal } from '@/components/ResultModal';
import { ErrorModal } from '@/components/ErrorModal';
import { useNavigate } from 'react-router-dom';
import { getRandomNickname } from '@/utils/nickname';

export const GamePage = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const updateRoom = useRoomStore((state) => state.updateRoom);
  const gameState = useRoomStore((state) => state.gameState);
  const currentPlayerName = usePlayerStore((state) => state.currentPlayerName);
  const setCurrentPlayerName = usePlayerStore((state) => state.setCurrentPlayerName);
  const setGameState = useRoomStore((state) => state.setGameState);
  const resetScore = usePlayerStore((state) => state.resetScore);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorModalTitle, setErrorModalTitle] = useState('');
  const [isResultOpen, setIsResultOpen] = useState(false);
  const navigate = useNavigate();

  // 페이지에서 나갈때
  // 스트릭트 모드에서 마운트 > 언마운트 > 마운트됨
  // useEffect(() => {
  //   return () => {
  //     console.log('게임방에서 나갔습니다');
  //     socketService.disconnect();
  //   };
  // }, []);

  useEffect(() => {
    updateRoom({ gameId });
  }, [gameId, updateRoom]);

  useEffect(() => {
    if (gameId && currentPlayerName) {
      socketService.joinRoom(gameId, currentPlayerName);
    }
  }, [gameId, currentPlayerName]);

  useEffect(() => {
    if (gameState === GameState.END) setIsResultOpen(true);
  }, [gameState]);

  useSocketException('joinRoom', (data) => {
    setErrorModalTitle(data);
    setIsErrorModalOpen(true);
  });

  const handleNameSubmit = (name: string) => {
    setCurrentPlayerName(name);
    setIsModalOpen(false); // 이름이 설정되면 모달 닫기
  };

  const handleEndGame = () => {
    setGameState(GameState.WAIT);
    resetScore();
    setIsResultOpen(false);
  };

  return (
    <>
      <HeaderBar />
      <div className="bg-surface-alt h-[calc(100vh-100px)] overflow-hidden">
        <div className="center p-4">
          {gameState === GameState.WAIT ? <GameHeader /> : <QuizHeader />}
        </div>
        <div className="grid grid-cols-4 grid-rows-1 gap-4 h-[calc(100%-320px)] p-4">
          <div className="hidden lg:block lg:col-span-1">
            <Chat />
          </div>

          <div className="col-span-4 lg:col-span-2">
            <QuizOptionBoard />
          </div>

          <div className="hidden lg:block lg:col-span-1">
            <ParticipantDisplay gameState={gameState} />
          </div>
          <ResultModal
            isOpen={isResultOpen}
            onClose={handleEndGame}
            currentPlayerName={currentPlayerName}
          />
          <Modal
            isOpen={isModalOpen && !currentPlayerName} // playerName이 없을 때만 모달을 열도록 설정
            title="플레이어 이름 설정"
            placeholder="이름을 입력하세요"
            initialValue={getRandomNickname()}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleNameSubmit}
          />

          <ErrorModal
            isOpen={isErrorModalOpen}
            title={errorModalTitle}
            buttonText="메인 페이지로 이동"
            onClose={() => navigate('/')}
          />
        </div>
      </div>
    </>
  );
};
