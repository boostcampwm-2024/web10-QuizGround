import { io } from 'socket.io-client';
import SocketEvents from '@/constants/socketEvents';
import { SocketDataMap } from './socketEventTypes';
import mockMap from './mocks/socketMocks';

type SocketEvent = keyof SocketDataMap;

type SocketInterface = {
  connected: boolean;
  id: string;

  emit: <T extends SocketEvent>(event: T, data: SocketDataMap[T]['request']) => void;

  on: <T extends SocketEvent>(
    event: string,
    callback: (data: SocketDataMap[T]['response']) => void
  ) => void;

  off: <T extends SocketEvent>(
    event: string,
    callback: (data: SocketDataMap[T]['response']) => void
  ) => void;

  onAny: <T extends SocketEvent>(
    callback: (event: T, data: SocketDataMap[T]['response']) => void
  ) => void;

  disconnect: () => void;
};

class SocketService {
  private socket: SocketInterface;
  private url: string;
  private handlers: (() => void)[];
  private handlerMap: Partial<
    Record<SocketEvent, ((data: SocketDataMap[SocketEvent]['response']) => void)[]>
  > = {};

  constructor(url: string) {
    this.socket = io() as SocketInterface;
    this.url = url;
    this.handlers = [];
  }

  async connect() {
    if (this.isActive()) return;
    this.socket = io(this.url) as SocketInterface;
    await new Promise<void>((resolve, reject) => {
      this.socket.on('connect', () => resolve());
      this.socket.on('error', () => reject());
    });
    this.initHandler();
    return;
  }

  async connectMock(gameId: keyof typeof mockMap) {
    if (this.isActive()) return;
    this.socket = new mockMap[gameId]() as SocketInterface;
    this.initHandler();
  }

  initHandler() {
    this.handlers.forEach((h) => h());
    Object.entries(this.handlerMap).forEach(([event, handlers]) =>
      handlers.forEach((h) => this.socket.on(event, h))
    );
    this.socket.onAny((eventName, ...args) => {
      console.log(`SOCKET[${eventName}]`, ...args);
    });
  }

  disconnect() {
    this.socket.disconnect();
  }

  isActive() {
    return this.socket && this.socket.connected;
  }

  getSocketId() {
    return this.socket.id;
  }

  // deprecated
  onPermanently<T extends SocketEvent>(
    event: T,
    callback: (data: SocketDataMap[T]['response']) => void
  ) {
    const handler = () => this.socket.on(event, callback);
    this.handlers.push(handler);
    if (this.isActive()) handler();
  }

  on<T extends SocketEvent>(event: T, callback: (data: SocketDataMap[T]['response']) => void) {
    if (this.isActive()) this.socket.on(event, callback);
    if (!this.handlerMap[event]) this.handlerMap[event] = [];
    this.handlerMap[event].push(callback);
  }

  off<T extends SocketEvent>(event: T, callback: (data: SocketDataMap[T]['response']) => void) {
    if (!this.handlerMap[event]) return;
    if (this.isActive()) this.socket.off(event, callback);
    this.handlerMap[event] = this.handlerMap[event].filter((e) => e !== callback);
  }

  emit<T extends SocketEvent>(event: T, data: SocketDataMap[T]['request']) {
    this.socket.emit(event, data);
  }

  async createRoom(payload: SocketDataMap['createRoom']['request']) {
    await this.connect();
    this.socket.emit(SocketEvents.CREATE_ROOM, payload);
  }

  async joinRoom(gameId: string, playerName: string) {
    if (gameId in mockMap) this.connectMock(gameId as keyof typeof mockMap);
    else if (!this.isActive()) await this.connect();
    this.socket.emit(SocketEvents.JOIN_ROOM, { gameId, playerName });
  }

  chatMessage(gameId: string, message: string) {
    this.socket.emit(SocketEvents.CHAT_MESSAGE, { gameId, message });
  }
}

const socketPort = process.env.SOCKET_PORT || '3333';
const socketUrl = `${window.location.origin}:${socketPort}/game`;
export const socketService = new SocketService(socketUrl);
