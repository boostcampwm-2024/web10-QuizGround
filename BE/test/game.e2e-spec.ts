import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { GameGateway } from '../src/game/game.gateway';
import { io, Socket } from 'socket.io-client';

describe('GameGateway (e2e)', () => {
  let app: INestApplication;
  let client1: Socket;
  let client2: Socket;
  let client3: Socket;

  const TEST_PORT = 3001;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [GameGateway],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useWebSocketAdapter(new IoAdapter(app));
    await app.listen(TEST_PORT);
  });

  beforeEach((done) => {
    let connectedClients = 0;
    const onConnect = () => {
      connectedClients++;
      if (connectedClients === 3) {
        done();
      }
    };

    client1 = io(`http://localhost:${TEST_PORT}/game`, {
      transports: ['websocket'],
      forceNew: true,
    });
    client2 = io(`http://localhost:${TEST_PORT}/game`, {
      transports: ['websocket'],
      forceNew: true,
    });
    client3 = io(`http://localhost:${TEST_PORT}/game`, {
      transports: ['websocket'],
      forceNew: true,
    });

    client1.on('connect', onConnect);
    client2.on('connect', onConnect);
    client3.on('connect', onConnect);
  });

  afterEach(() => {
    client1.close();
    client2.close();
    client3.close();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('createGame 이벤트 테스트', () => {
    it('유효한 설정으로 게임방 생성 성공', async () => {
      const gameConfig = {
        title: 'hello world!',
        gameMode: 'ranking',
        maxPlayerCount: 2,
        isPublicGame: true,
      };

      const response = await new Promise<{roomId: string, status: string}>(resolve => {
        client1.once('createGame', resolve);
        client1.emit('createGame', gameConfig);
      });

      expect(response.status).toBe('success');
      expect(response.roomId).toBeDefined();
      expect(typeof response.roomId).toBe('string');
    });

    const invalidConfigs = [
      {
        case: '빈 title',
        config: { title: '', gameMode: '', maxPlayerCount: 2, isPublicGame: true },
      },
      {
        case: '빈 gameMode',
        config: { title: 'hello', gameMode: '', maxPlayerCount: 2, isPublicGame: true },
      },
      {
        case: '잘못된 gameMode',
        config: { title: 'hello', gameMode: 'invalid', maxPlayerCount: 2, isPublicGame: true },
      },
      {
        case: '최소 인원 미달',
        config: { title: 'hello', gameMode: 'ranking', maxPlayerCount: 0, isPublicGame: true },
      },
      {
        case: '최대 인원 초과',
        config: { title: 'hello', gameMode: 'ranking', maxPlayerCount: 201, isPublicGame: true },
      },
      {
        case: '잘못된 boolean 타입',
        config: { title: 'hello', gameMode: 'ranking', maxPlayerCount: 2, isPublicGame: '안녕' },
      },
    ]

    invalidConfigs.forEach(({ case: testCase, config }) => {
      it(testCase, (done) => {
        client1.once('exception', (error) => {
          expect(error).toBeDefined();
          expect(error.status).toBe('error');
          expect(error.message).toBeDefined();
          done();
        });

        client1.emit('createGame', config);
      });
    });
  });
});