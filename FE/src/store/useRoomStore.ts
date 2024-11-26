import { socketService } from '@/api/socket';
import { create } from 'zustand';
import GameState from '@/constants/gameState';

type RoomOption = {
  title?: string;
  gameMode?: 'RANKING' | 'SURVIVAL';
  maxPlayerCount?: number;
  isPublic?: boolean;
  gameId?: string;
};

type RoomStore = {
  title: string;
  gameMode: 'RANKING' | 'SURVIVAL';
  gameState: (typeof GameState)[keyof typeof GameState];
  maxPlayerCount: number;
  isPublic: boolean;
  gameId: string;
  updateRoom: (roomOption: RoomOption) => void;
  setGameState: (state: (typeof GameState)[keyof typeof GameState]) => void;
  reset: () => void;
};

export const useRoomStore = create<RoomStore>((set) => ({
  title: '',
  gameMode: 'SURVIVAL',
  maxPlayerCount: 50,
  isPublic: true,
  gameId: '',
  gameState: GameState.WAIT,
  updateRoom: (roomOption: RoomOption) => {
    set(() => roomOption);
  },
  setGameState: (gameState) => {
    set(() => ({ gameState }));
  },
  reset: () =>
    set({
      title: '',
      gameMode: 'SURVIVAL',
      maxPlayerCount: 50,
      isPublic: true,
      gameId: '',
      gameState: GameState.WAIT
    })
}));

socketService.on('createRoom', (data) => {
  useRoomStore.getState().updateRoom({ gameId: data.gameId });
});

socketService.on('updateRoomOption', (data) => {
  useRoomStore.getState().updateRoom(data);
});

socketService.on('startGame', () => {
  useRoomStore.getState().setGameState(GameState.PROGRESS);
});

socketService.on('endGame', () => {
  useRoomStore.getState().setGameState(GameState.END);
});

socketService.on('disconnect', () => {
  useRoomStore.getState().reset();
});
