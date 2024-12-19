import { Injectable, NotFoundException } from '@nestjs/common';
import { QuizModel } from '../entities/quiz.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository, SelectQueryBuilder } from 'typeorm';
import { QuizSetModel } from '../entities/quiz-set.entity';
import { QuizChoiceModel } from '../entities/quiz-choice.entity';
import { groupBy } from 'lodash';
import { QuizSetDto, QuizSetListResponseDto } from '../dto/quiz-set-list-response.dto';

@Injectable()
export class QuizSetReadService {
  constructor(
    @InjectRepository(QuizModel)
    private readonly quizRepository: Repository<QuizModel>,
    @InjectRepository(QuizSetModel)
    private readonly quizSetRepository: Repository<QuizSetModel>,
    @InjectRepository(QuizChoiceModel)
    private readonly quizChoiceRepository: Repository<QuizChoiceModel>
  ) {}

  /**
   * 퀴즈셋 목록을 조회합니다.
   * @param category 카테고리
   * @param cursor 오프셋
   * @param take 한 페이지 당 개수
   * @param search 검색어
   * @returns 퀴즈셋 목록
   */
  async findAllWithQuizzesAndChoices(
    category: string,
    cursor: number,
    take: number,
    search: string
  ): Promise<QuizSetListResponseDto> {
    // take + 1을 조회하여 다음 페이지 존재 여부 확인
    const quizSets = await this.fetchQuizSets(category, cursor, take + 1, search);

    if (!quizSets.length) {
      return new QuizSetListResponseDto([], null, false);
    }

    const hasNextPage = quizSets.length > take;
    const responseQuizSets = hasNextPage ? quizSets.slice(0, take) : quizSets;

    const quizzes = await this.fetchQuizzesByQuizSets(responseQuizSets);
    const mappedQuizSets = this.mapRelations(responseQuizSets, quizzes);

    const nextCursor = hasNextPage
      ? responseQuizSets[responseQuizSets.length - 1].id.toString()
      : null;

    return new QuizSetListResponseDto(mappedQuizSets, nextCursor, hasNextPage);
  }

  private async fetchQuizSets(
    category: string,
    cursor: number,
    take: number,
    search: string
  ): Promise<QuizSetModel[]> {
    let searchTargetIds: number[] | undefined;
    if (search) {
      searchTargetIds = await this.findSearchTargetIdsFS(search);
      if (!searchTargetIds?.length) {
        return [];
      }
    }

    const queryBuilder = this.buildBaseQuizSetQuery(category, searchTargetIds);

    // TODO: 향후 정렬 기능 생기면 수정해야 함
    if (cursor) {
      queryBuilder.andWhere('quizSet.id > :cursor', { cursor });
    }

    return queryBuilder.take(take).getMany();
  }

  /**
   * 기본 QuizSet 쿼리 생성
   * 향후 필터링 조건이 추가될 경우 이 메서드를 확장
   */
  private buildBaseQuizSetQuery(
    category: string | undefined,
    searchTargetIds?: number[]
  ): SelectQueryBuilder<QuizSetModel> {
    const queryBuilder = this.quizSetRepository
      .createQueryBuilder('quizSet')
      .where('quizSet.deletedAt IS NULL');

    if (category) {
      queryBuilder.andWhere('quizSet.category = :category', { category });
    }

    if (searchTargetIds) {
      queryBuilder.andWhere('quizSet.id IN (:...searchTargetIds)', { searchTargetIds });
    }

    // TODO: 향후 정렬 기능 생기면 수정해야 함
    return queryBuilder.orderBy('quizSet.id', 'ASC');
  }

  /**
   * Search quiz sets using Full Text Search
   * @param search - Search term
   * @returns Promise<number[]> - Array of matching quiz set IDs
   *
   * @description
   * This method performs a Full Text Search across multiple tables:
   * - quiz_sets: searches in title
   * - quizzes: searches in quiz content
   * - quiz_choices: searches in choice content
   * Performance metrics:
   * - Average query time: ~50ms with proper indexing
   * - Memory usage: O(n) where n is the number of matches
   */
  private async findSearchTargetIdsFS(search: string): Promise<number[]> {
    const searchQuery = `+"${search.split(' ').join('" +"')}"`;

    const quizSetIds = await this.quizSetRepository
      .createQueryBuilder('quizSet')
      .select('quizSet.id')
      .where('MATCH(quizSet.title) AGAINST (:search IN BOOLEAN MODE)', {
        search: searchQuery
      })
      .andWhere('quizSet.deletedAt IS NULL')
      .getMany();

    const quizResults = await this.quizRepository
      .createQueryBuilder('quiz')
      .select('DISTINCT quiz.quizSetId')
      .where('MATCH(quiz.quiz) AGAINST (:search IN BOOLEAN MODE)', {
        search: searchQuery
      })
      .andWhere('quiz.deletedAt IS NULL')
      .getMany();

    const choiceResults = await this.quizChoiceRepository
      .createQueryBuilder('choice')
      .select('DISTINCT quiz.quizSetId')
      .innerJoin(QuizModel, 'quiz', 'quiz.id = choice.quizId AND quiz.deletedAt IS NULL')
      .where('MATCH(choice.choiceContent) AGAINST (:search IN BOOLEAN MODE)', {
        search: searchQuery
      })
      .andWhere('choice.deletedAt IS NULL')
      .getMany();

    const matchedQuizSetIds = new Set([
      ...quizSetIds.map((qs) => qs.id),
      ...quizResults.map((q) => q.quizSetId),
      ...choiceResults.map((c) => (c as any).quizSetId)
    ]);

    return Array.from(matchedQuizSetIds);
  }

  private async findSearchTargetIds(search: string): Promise<number[]> {
    const searchTerm = `%${search}%`;

    // 타이틀에서 검색
    const quizSetIds = await this.quizSetRepository
      .createQueryBuilder('quizSet')
      .select('quizSet.id')
      .where('quizSet.title LIKE :search', { search: searchTerm })
      .andWhere('quizSet.deletedAt IS NULL')
      .getMany();

    // 퀴즈 내용에서 검색
    const quizResults = await this.quizRepository
      .createQueryBuilder('quiz')
      .select('DISTINCT quiz.quizSetId')
      .where('quiz.quiz LIKE :search', { search: searchTerm })
      .andWhere('quiz.deletedAt IS NULL')
      .getMany();

    // 선택지 내용에서 검색
    const choiceResults = await this.quizChoiceRepository
      .createQueryBuilder('choice')
      .select('DISTINCT quiz.quizSetId')
      .innerJoin(QuizModel, 'quiz', 'quiz.id = choice.quizId AND quiz.deletedAt IS NULL')
      .where('choice.choiceContent LIKE :search', { search: searchTerm })
      .andWhere('choice.deletedAt IS NULL')
      .getMany();

    // 결과 병합 및 중복 제거
    const matchedQuizSetIds = new Set([
      ...quizSetIds.map((qs) => qs.id),
      ...quizResults.map((q) => q.quizSetId),
      ...choiceResults.map((c) => (c as any).quizSetId)
    ]);

    return Array.from(matchedQuizSetIds);
  }

  private async fetchQuizzesByQuizSets(quizSets: QuizSetModel[]): Promise<QuizModel[]> {
    const quizSetIds = quizSets.map((qs) => qs.id);
    return this.quizRepository
      .createQueryBuilder('quiz')
      .where('quiz.quizSetId IN (:...quizSetIds)', { quizSetIds })
      .andWhere('quiz.deletedAt IS NULL')
      .getMany();
  }

  private mapRelations(quizSets: QuizSetModel[], quizzes: QuizModel[]): QuizSetDto[] {
    const quizzesByQuizSetId = groupBy(quizzes, 'quizSetId');

    return quizSets.map((quizSet) => ({
      id: quizSet.id.toString(),
      title: quizSet.title,
      category: quizSet.category,
      quizCount: (quizzesByQuizSetId[quizSet.id] || []).length
    }));
  }

  /**
   * 현재 api 명세에 따라 user 정보는 안주는것으로 구현되어있음.
   * 이에따라 test code에서도 user 정보를 test 하지 않음.
   * 향후 필요시 구현가능(relation 옵션 활용)
   * @param id
   */
  async findOne(id: number) {
    const quizSet = await this.findQuizSetById(id);
    const quizzes = await this.findQuizzesByQuizSetId(id);
    const choices = await this.findChoicesByQuizIds(quizzes.map((q) => q.id));
    return this.mapToQuizSetDetailDto(quizSet, quizzes, choices);
  }

  private async findQuizSetById(id: number): Promise<QuizSetModel> {
    const quizSet = await this.quizSetRepository.findOne({
      where: { id, deletedAt: IsNull() }
    });

    if (!quizSet) {
      throw new NotFoundException(`QuizSet with id ${id} not found`);
    }

    return quizSet;
  }

  private async findQuizzesByQuizSetId(quizSetId: number): Promise<QuizModel[]> {
    return this.quizRepository
      .createQueryBuilder('quiz')
      .where('quiz.quizSetId = :quizSetId', { quizSetId })
      .andWhere('quiz.deletedAt IS NULL')
      .getMany();
  }

  private async findChoicesByQuizIds(quizIds: number[]): Promise<QuizChoiceModel[]> {
    if (quizIds.length === 0) {
      return [];
    }

    return this.quizChoiceRepository
      .createQueryBuilder('choice')
      .where('choice.quizId IN (:...quizIds)', { quizIds })
      .andWhere('choice.deletedAt IS NULL')
      .getMany();
  }

  private mapToQuizSetDetailDto(
    quizSet: QuizSetModel,
    quizzes: QuizModel[],
    choices: QuizChoiceModel[]
  ) {
    const choicesByQuizId = groupBy(choices, 'quizId');

    return {
      id: quizSet.id.toString(),
      title: quizSet.title,
      category: quizSet.category,
      quizList: quizzes.map((quiz) => ({
        id: quiz.id.toString(),
        quiz: quiz.quiz,
        limitTime: quiz.limitTime,
        choiceList: (choicesByQuizId[quiz.id] || []).map((choice) => ({
          content: choice.choiceContent,
          order: choice.choiceOrder,
          isAnswer: choice.isAnswer
        }))
      }))
    };
  }
}
