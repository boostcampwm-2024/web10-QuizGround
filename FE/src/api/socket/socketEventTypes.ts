// 채팅 메시지 전달 타입
type ChatMessageRequest = {
  gameId: string; // PIN
  message: string;
};

type ChatMessageResponse = {
  playerId: string; // socketId
  playerName: string;
  message: string;
  timestamp: number;
};

// 플레이어 위치 업데이트 타입
type UpdatePositionRequest = {
  gameId: string;
  newPosition: [number, number];
};

type UpdatePositionResponse = {
  playerId: string; // socketId
  playerPosition: [number, number];
};

type CreateRoomResponse = {
  gameId: string; // PIN
};

// 게임방 옵션 수정 타입
type UpdateRoomOptionRequest = {
  gameId: string;
  title: string;
  gameMode: 'RANKING' | 'SURVIVAL';
  maxPlayerCount: number;
  isPublic: boolean;
};

type UpdateRoomOptionResponse = {
  title: string;
  gameMode: 'RANKING' | 'SURVIVAL';
  maxPlayerCount: number;
  isPublic: boolean;
};

// 게임방 퀴즈셋 수정 타입
type UpdateRoomQuizsetRequest = {
  gameId: string;
  quizSetId: number;
  quizCount: number;
};

type UpdateRoomQuizsetResponse = {
  quizSetId: number;
  quizCount: number;
};

type JoinRoomResponse = {
  players: Array<{
    playerId: string; // socketId
    playerName: string;
    playerPosition: [number, number];
    isHost: boolean;
  }>;
};

type getSelfIdResponse = {
  playerId: string;
};

type setPlayerNameRequest = {
  playerName: string;
};

type setPlayerNameResponse = {
  playerId: string;
  playerName: string;
};

// 게임 시작 타입
type StartGameRequest = {
  gameId: string;
};

type StartGameResponse = Record<string, never>; // 빈 객체

type EndGameRequest = {
  gameId: string;
};
type EndGameResponse = {
  hostId: string;
};

// 퀴즈 시간 종료 타입
type EndQuizTimeEvent = {
  answer: number; // 정답
  players: { playerId: string; score: number; isAnswer: boolean }[];
};

// 퀴즈 시작 타입
type StartQuizTimeEvent = {
  quiz: string;
  choiceList: { content: string; order: number }[];
  endTime: number; //timestamp
  startTime: number; //timestamp
};

// 게임방 퇴장 타입
type ExitRoomEvent = {
  playerId: string;
};

type KickRoomRequest = {
  gameId: string;
  kickPlayerId: string;
};

type KickRoomResponse = {
  playerId: string;
};

type UpdateHostResponse = {
  hostId: string;
};

// 전체 소켓 이벤트 타입 맵
export type SocketDataMap = {
  chatMessage: {
    request: ChatMessageRequest;
    response: ChatMessageResponse | ChatMessageResponse[];
  };
  updatePosition: {
    request: UpdatePositionRequest;
    response: UpdatePositionResponse | UpdatePositionResponse[];
  };
  createRoom: {
    request: null;
    response: CreateRoomResponse;
  };
  updateRoomOption: {
    request: UpdateRoomOptionRequest;
    response: UpdateRoomOptionResponse;
  };
  updateRoomQuizset: {
    request: UpdateRoomQuizsetRequest;
    response: UpdateRoomQuizsetResponse;
  };
  joinRoom: {
    request: null;
    response: JoinRoomResponse;
  };
  getSelfId: {
    request: null;
    response: getSelfIdResponse;
  };
  setPlayerName: {
    request: setPlayerNameRequest;
    response: setPlayerNameResponse;
  };
  startGame: {
    request: StartGameRequest;
    response: StartGameResponse;
  };
  endQuizTime: {
    request: null;
    response: EndQuizTimeEvent;
  };
  startQuizTime: {
    request: null;
    response: StartQuizTimeEvent;
  };
  exitRoom: {
    request: null;
    response: ExitRoomEvent;
  };
  endGame: {
    request: EndGameRequest;
    response: EndGameResponse;
  };

  kickRoom: {
    request: KickRoomRequest;
    response: KickRoomResponse;
  };

  updateHost: {
    request: null;
    response: UpdateHostResponse;
  };

  exception: {
    request: null;
    response: {
      event?: string;
      eventName?: string;
      message: string;
    };
  };

  connect: { request: null; response: null };
  connection: { request: null; response: null };
  disconnect: { request: null; response: null };
};
