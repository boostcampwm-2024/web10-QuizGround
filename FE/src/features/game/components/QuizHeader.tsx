import { useQuizStore } from '@/features/game/data/store/useQuizStore';
import { useEffect, useState } from 'react';
import AnswerModal from './AnswerModal';
import QuizState from '@/constants/quizState';
import Lottie from 'lottie-react';
import quizLoading from '../../../assets/lottie/quiz_loading.json';
import { getServerTimestamp } from '@/features/game/utils/serverTime';

export const QuizHeader = () => {
  const currentQuiz = useQuizStore((state) => state.currentQuiz);
  const quizState = useQuizStore((state) => state.quizState);
  const [seconds, setSeconds] = useState(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [limitTime, setLimitTime] = useState(0);
  useEffect(() => {
    if (currentQuiz) {
      setSeconds((currentQuiz.endTime - getServerTimestamp()) / 1000);
      setLimitTime((currentQuiz.endTime - currentQuiz.startTime) / 1000);
    }
  }, [currentQuiz]);

  useEffect(() => {
    setIsAnswerVisible(quizState === QuizState.END);
  }, [quizState]);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (seconds <= 0 || !currentQuiz) return;
      setSeconds((currentQuiz.endTime - getServerTimestamp()) / 1000);
    });
  }, [currentQuiz, seconds]);

  if (!currentQuiz)
    return (
      <div className="border border-default component-popup flex justify-center items-center h-[100%] w-[100%] text-gray-400">
        <Lottie animationData={quizLoading} loop={true} className="w-[150px] h-[150px] mr-4" />
        <div>곧 퀴즈가 시작됩니다</div>
      </div>
    );

  if (currentQuiz.startTime > getServerTimestamp())
    return (
      <div className="border border-default component-popup flex justify-center items-center h-[100%] w-[100%]  text-orange-300 font-bold text-7xl">
        {Math.ceil((currentQuiz.startTime - getServerTimestamp()) / 1000)}
      </div>
    );

  return (
    <div className="border border-default component-popup h-[100%] w-[100%] p-8 flex flex-col">
      <div className="flex flex-row-reverse w-[100%] h-8 bg-surface-alt">
        <div
          className="flex justify-center items-center w-20 h-8 text-lg absolute tabular-nums"
          style={{ color: seconds / limitTime > 0.2 ? 'black' : 'red' }}
        >
          {seconds <= 0 ? '종료' : seconds.toFixed(2)}
        </div>
        <div className="w-[100%] h-[100%]">
          {seconds > 0 && (
            <div
              className="h-[100%]"
              style={{
                transform: `scale(${seconds / limitTime}, 1)`,
                transformOrigin: 'left center',
                background: seconds / limitTime > 0.2 ? 'green' : 'brown'
              }}
            ></div>
          )}
        </div>
      </div>
      <div className="flex justify-center items-center font-bold text-2xl flex-grow">
        {'Q. ' + currentQuiz.quiz}
      </div>
      <AnswerModal isOpen={isAnswerVisible} />
    </div>
  );
};
