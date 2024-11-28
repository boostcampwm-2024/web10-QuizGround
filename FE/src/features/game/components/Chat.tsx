import { socketService } from '@/api/socket';
import { useChatStore } from '@/features/game/data/store/useChatStore';
import { usePlayerStore } from '@/features/game/data/store/usePlayerStore';
import { useRoomStore } from '@/features/game/data/store/useRoomStore';
import { ReactElement, useEffect, useRef, useState } from 'react';

const Chat = () => {
  const gameId = useRoomStore((state) => state.gameId);
  const currentPlayerId = usePlayerStore((state) => state.currentPlayerId);
  const messages = useChatStore((state) => state.messages);
  const [inputValue, setInputValue] = useState('');
  const players = usePlayerStore((state) => state.players);
  const [myMessages, setMyMessages] = useState<typeof messages>([]);

  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessage, setNewMessage] = useState(false);
  const [prevMessageCount, setPrevMessageCount] = useState(messages.length);
  const [chatList, setChatList] = useState<ReactElement[]>([]);

  const scrollToBottom = () => {
    if (chatBottomRef.current) {
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({
          behavior: 'instant',
          block: 'end'
        });
        setNewMessage(false);
      }, 0);
    }
  };

  const handleScroll = () => {
    const container = chatContainerRef.current;
    if (!container) return;

    const isBottom =
      Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 10;

    if (isBottom) {
      setIsAtBottom(true);
    } else {
      setIsAtBottom(false);
    }
  };

  const handleScrollToBottomClick = () => {
    scrollToBottom();
    setIsAtBottom(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputValue.trim() && gameId) {
      const message = {
        playerId: '',
        message: inputValue,
        playerName: '',
        timestamp: 0
      };
      scrollToBottom();
      setMyMessages([...myMessages, message]);
      socketService.chatMessage(gameId, inputValue);
      setInputValue('');
    }
  };

  // 메시지 낙관적 업데이트
  useEffect(() => {
    if (myMessages.length > 0) {
      let myMessageCount = 0;
      for (let i = prevMessageCount; i < messages.length; i++) {
        if (messages[i].playerId === currentPlayerId) myMessageCount++;
      }
      if (myMessageCount > 0) setMyMessages((state) => state.slice(myMessageCount));
    }
  }, [prevMessageCount, myMessages, currentPlayerId, messages]);

  // 새로운 채팅이 올때 자동 스크롤
  useEffect(() => {
    if (messages.length > prevMessageCount) {
      setNewMessage(true); // 새로운 메시지가 도착한 것으로 판단
      setPrevMessageCount(messages.length);
      setChatList([
        ...chatList,
        ...messages.slice(prevMessageCount).map((e, i) => (
          <div
            className="break-words leading-5 mt-3"
            key={prevMessageCount + i}
            style={{
              opacity: players.has(e.playerId) && !players.get(e.playerId)!.isAlive ? '0.5' : '1',
              color: e.playerId === currentPlayerId ? 'cornflowerblue' : 'inherit'
            }}
          >
            <span className="font-bold mr-2">
              {players.has(e.playerId) && !players.get(e.playerId)!.isAlive && '👻'}
              {e.playerName}
            </span>
            <span>{e.message}</span>
          </div>
        ))
      ]);
    }

    if (isAtBottom) {
      requestAnimationFrame(() => scrollToBottom());
    }
  }, [messages, isAtBottom, prevMessageCount, chatList, players, currentPlayerId]);

  return (
    <div className="component-default h-[100%]">
      <div className="border-b border-default center h-[2.5rem]">메시지</div>
      <div
        ref={chatContainerRef}
        className="p-2 h-[calc(100%-6rem)] overflow-y-scroll"
        onScroll={handleScroll}
      >
        <div>
          <div className="flex justify-center mb-4" key="1">
            🎉 QuizGround에 오신 것을 환영합니다 🎉
          </div>
          {chatList}
          {myMessages.map((e, i) => (
            <div className="break-words leading-5 mt-3" key={-i - 1}>
              <div className="inline-block mr-2">
                <div className="w-4 h-4 border-4 border-blue-500 border-dotted rounded-full animate-spin"></div>
              </div>
              <span>{e.message}</span>
            </div>
          ))}
        </div>
        <div ref={chatBottomRef} key="0" />
      </div>
      <div className="center border-t border-default h-[3.5rem] p-2">
        <form onSubmit={handleSubmit} className="w-full h-full">
          <input
            className="bg-[#0001] w-[100%] h-[100%] rounded-m p-2"
            type="text"
            placeholder="메시지"
            value={inputValue}
            onChange={handleInputChange}
          />
        </form>
      </div>
      <div className="relative z-0">
        {newMessage && !isAtBottom && (
          <button
            className="absolute bottom-14 scale-75 bg-blue-500 text-white p-2 rounded w-full"
            onClick={handleScrollToBottomClick}
            style={{ zIndex: 1000 }}
          >
            {`${messages[messages.length - 1].playerName}: ${
              messages[messages.length - 1].message.length > 15
                ? messages[messages.length - 1].message.slice(0, 15) + '...'
                : messages[messages.length - 1].message
            }`}
          </button>
        )}
      </div>
    </div>
  );
};

export default Chat;
