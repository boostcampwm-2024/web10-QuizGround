import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QuizService } from '../src/quiz/quiz.service';
import { QuizSetModel } from '../src/quiz/entities/quiz-set.entity';
import { QuizModel } from '../src/quiz/entities/quiz.entity';
import { QuizChoiceModel } from '../src/quiz/entities/quiz-choice.entity';
import { UserModel } from '../src/user/entities/user.entity';
import { UserQuizArchiveModel } from '../src/user/entities/user-quiz-archive.entity';
import { CreateQuizSetDto } from '../src/quiz/dto/create-quiz.dto';

describe('QuizService', () => {
  let quizService: QuizService;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '../.env',
          isGlobal: true
        }),
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: process.env.DB_HOST_TEST || process.env.DB_HOST || '127.0.0.1',
          port: +process.env.DB_PORT_TEST || +process.env.DB_PORT || 3306,
          username: process.env.DB_USER_TEST || process.env.DB_USER || 'root',
          password: process.env.DB_PASSWD_TEST || process.env.DB_PASSWD || 'test',
          database: process.env.DB_NAME_TEST || process.env.DB_NAME || 'test_db',
          entities: [QuizSetModel, QuizModel, QuizChoiceModel, UserModel, UserQuizArchiveModel],
          synchronize: true // test모드에서는 항상 활성화
          // logging: true, // 모든 쿼리 로깅
          // logger: 'advanced-console'
          // extra: {
          //   // 글로벌 batch size 설정
          //   maxBatchSize: 100
          // }
        }),
        TypeOrmModule.forFeature([QuizSetModel, QuizModel, QuizChoiceModel, UserModel])
      ],
      providers: [QuizService]
    }).compile();

    quizService = module.get<QuizService>(QuizService);
    dataSource = module.get<DataSource>(DataSource);
  });

  beforeEach(async () => {
    queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
  });

  afterEach(async () => {
    await queryRunner.rollbackTransaction();
    await queryRunner.release();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('should be defined', () => {
    expect(quizService).toBeDefined();
    expect(dataSource).toBeDefined();
  });

  describe('createQuizSet', () => {
    it('퀴즈셋을 성공적으로 생성해야 한다', async () => {
      // Given
      const createQuizSetDto: CreateQuizSetDto = {
        title: '자바스크립트 기초',
        category: 'PROGRAMMING',
        quizList: [
          {
            quiz: 'JavaScript의 원시 타입이 아닌 것은?',
            limitTime: 30,
            choiceList: [
              {
                choiceContent: 'String',
                choiceOrder: 1,
                isAnswer: false
              },
              {
                choiceContent: 'Array',
                choiceOrder: 2,
                isAnswer: true
              },
              {
                choiceContent: 'Number',
                choiceOrder: 3,
                isAnswer: false
              }
            ]
          }
        ]
      };

      // When
      const result = await quizService.createQuizSet(createQuizSetDto);

      // Then
      expect(result).toBeDefined();
      expect(result.data.id).toBeDefined();

      // 데이터가 정상적으로 저장되었는지 확인
      const savedQuizSet = await queryRunner.manager.findOne(QuizSetModel, {
        where: { id: result.data.id },
        relations: ['quizList', 'quizList.choiceList', 'user']
      });

      expect(savedQuizSet).toBeDefined();
      expect(savedQuizSet.title).toBe(createQuizSetDto.title);
      // expect(savedQuizSet.user.email).toBe('honux@codesquad.co.kr');
      expect(savedQuizSet.quizList).toHaveLength(1);
      expect(savedQuizSet.quizList[0].choiceList).toHaveLength(3);
    });

    it('정답이 없는 퀴즈셋 생성 시 에러가 발생해야 한다', async () => {
      // Given
      const invalidQuizSetDto: CreateQuizSetDto = {
        title: '잘못된 퀴즈셋',
        category: 'PROGRAMMING',
        quizList: [
          {
            quiz: '문제',
            limitTime: 30,
            choiceList: [
              {
                choiceContent: '보기1',
                choiceOrder: 1,
                isAnswer: false
              },
              {
                choiceContent: '보기2',
                choiceOrder: 2,
                isAnswer: false
              }
            ]
          }
        ]
      };

      // When & Then
      await expect(quizService.createQuizSet(invalidQuizSetDto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('선택지 번호가 중복된 퀴즈셋 생성 시 에러가 발생해야 한다', async () => {
      // Given
      const duplicateOrderQuizSetDto: CreateQuizSetDto = {
        title: '중복 번호 퀴즈셋',
        category: 'PROGRAMMING',
        quizList: [
          {
            quiz: '문제',
            limitTime: 30,
            choiceList: [
              {
                choiceContent: '보기1',
                choiceOrder: 1,
                isAnswer: true
              },
              {
                choiceContent: '보기2',
                choiceOrder: 1,
                isAnswer: false
              }
            ]
          }
        ]
      };

      // When & Then
      await expect(quizService.createQuizSet(duplicateOrderQuizSetDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('findAllWithQuizzesAndChoices', () => {
    it('카테고리별 퀴즈셋 목록을 가져와야한다', async () => {
      // Given - 테스트 데이터 생성
      const createQuizSetDto: CreateQuizSetDto = {
        title: '자바스크립트 기초',
        category: 'PROGRAMMING',
        quizList: [
          {
            quiz: '테스트 문제',
            limitTime: 30,
            choiceList: [
              {
                choiceContent: '보기1',
                choiceOrder: 1,
                isAnswer: true
              },
              {
                choiceContent: '보기2',
                choiceOrder: 2,
                isAnswer: false
              }
            ]
          }
        ]
      };

      await quizService.createQuizSet(createQuizSetDto);

      // When
      const result = await quizService.findAllWithQuizzesAndChoices('PROGRAMMING', 0, 10);

      // Then
      expect(result.quizSetList).toBeDefined();
      expect(result.quizSetList[0].category).toBe('PROGRAMMING');
      expect(result.quizSetList[0].quizList).toHaveLength(1);
      expect(result.quizSetList[0].quizList[0].choiceList).toHaveLength(2);
    });

    it('존재하지 않는 카테고리는 빈 배열을 반환해야 한다', async () => {
      // When
      const result = await quizService.findAllWithQuizzesAndChoices('INVALID', 0, 10);

      // Then
      expect(result.quizSetList).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    let testQuizSet;

    beforeEach(async () => {
      // Given - 테스트 데이터 생성
      const dto = {
        title: '테스트 퀴즈',
        category: 'TEST',
        quizList: [
          {
            quiz: '문제1',
            limitTime: 30,
            choiceList: [
              {
                choiceContent: '보기1',
                choiceOrder: 1,
                isAnswer: true
              }
            ]
          }
        ]
      };

      const result = await quizService.createQuizSet(dto);
      testQuizSet = result.data;
    });

    it('ID로 퀴즈셋을 찾을 수 있어야 한다.', async () => {
      // When
      const result = await quizService.findOne(testQuizSet.id);

      // Then
      expect(result).toBeDefined();
      expect(result.id).toBe(testQuizSet.id.toString());
      expect(result.quizList).toHaveLength(1);
      expect(result.quizList[0].choiceList).toHaveLength(1);
    });

    it('존재하지 않는 ID로 조회시 에러가 발생해야 한다.', async () => {
      // When & Then
      await expect(quizService.findOne(999999)).rejects.toThrow();
    });
  });

  describe('update', () => {
    let originQuizSetId;

    beforeEach(async () => {
      // Given - 테스트용 퀴즈셋 생성
      const dto = {
        title: '원본 퀴즈',
        category: 'TEST',
        quizList: [
          {
            quiz: '원본 문제',
            limitTime: 30,
            choiceList: [
              {
                choiceContent: '원본 보기',
                choiceOrder: 1,
                isAnswer: true
              }
            ]
          }
        ]
      };

      const result = await quizService.createQuizSet(dto);
      originQuizSetId = result.data.id;
    });

    it('퀴즈셋을 수정할 수 있어야 한다.', async () => {
      // Given
      const updateDto = {
        title: '수정된 퀴즈',
        category: 'UPDATED',
        quizList: [
          {
            quiz: '수정된 문제',
            limitTime: 60,
            choiceList: [
              {
                choiceContent: '수정된 보기',
                choiceOrder: 1,
                isAnswer: true
              }
            ]
          }
        ]
      };

      // When
      await quizService.update(originQuizSetId, updateDto);

      // Then
      const updated = await quizService.findOne(originQuizSetId);
      console.log('updated: ' + JSON.stringify(updated));
      expect(updated.id).toBe(originQuizSetId.toString());
      expect(updated.title).toBe('수정된 퀴즈');
      expect(updated.category).toBe('UPDATED');
      expect(updated.quizList[0].quiz).toBe('수정된 문제');
      expect(updated.quizList[0].limitTime).toBe(60);
    });

    it('존재하지 않는 퀴즈셋 수정시 에러가 발생해야 한다.', async () => {
      // When & Then
      await expect(quizService.update(999999, { title: 'test' })).rejects.toThrow();
    });
  });

  describe('remove', () => {
    let testQuizSet;

    beforeEach(async () => {
      // Given - 테스트용 퀴즈셋 생성
      const dto = {
        title: '삭제될 퀴즈',
        category: 'TEST',
        quizList: [
          {
            quiz: '문제',
            limitTime: 30,
            choiceList: [
              {
                choiceContent: '보기',
                choiceOrder: 1,
                isAnswer: true
              }
            ]
          }
        ]
      };

      const result = await quizService.createQuizSet(dto);
      testQuizSet = result.data;
    });

    it('퀴즈셋을 soft delete 할 수 있어야 한다.', async () => {
      // When
      const result = await quizService.remove(testQuizSet.id);

      // Then
      expect(result.success).toBe(true);

      // soft delete 되었는지 확인 (일반 조회시 조회 안됨)
      await expect(quizService.findOne(testQuizSet.id)).rejects.toThrow();
    });

    it('존재하지 않는 퀴즈셋 삭제시 에러가 발생해야 한다.', async () => {
      // When & Then
      await expect(quizService.remove(999999)).rejects.toThrow();
    });
  });
});
