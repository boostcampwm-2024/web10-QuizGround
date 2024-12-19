import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseModel } from '../../common/entity/base.entity';
import { UserModel } from '../../user/entities/user.entity';
import { QuizModel } from './quiz.entity';
import { UserQuizArchiveModel } from '../../user/entities/user-quiz-archive.entity';

const CategoriesEnum = Object.freeze({
  GENERAL: 'GENERAL',
  MOVIE: 'MOVIE',
  MUSIC: 'MUSIC',
  FOOD: 'FOOD',
  ANIMAL: 'ANIMAL',
  LANGUAGE: 'LANGUAGE',
  NEWS: 'NEWS',
  MATH: 'MATH',
  SCIENCE: 'SCIENCE',
  ECONOMY: 'ECONOMY',
  HISTORY: 'HISTORY',
  GEOGRAPHY: 'GEOGRAPHY',
  SPORTS: 'SPORTS',
  GAME: 'GAME',
  IT: 'IT',
  POLITICS: 'POLITICS'
});

@Entity('quiz_set')
export class QuizSetModel extends BaseModel {
  @Column()
  @Index({
    fulltext: true,
    parser: 'ngram' // ngram 파서 사용
  }) // Full Text Search 인덱스 추가
  title: string;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({
    type: 'enum',
    enum: CategoriesEnum,
    default: CategoriesEnum.GENERAL // 기본값 설정 가능
  })
  category: string;

  @ManyToOne(() => UserModel, (user) => user.quizSetList, {
    lazy: true
  })
  @JoinColumn({ name: 'user_id' })
  user: Promise<UserModel>;

  @OneToMany(() => QuizModel, (quiz) => quiz.quizSet)
  quizList: QuizModel[];

  @OneToMany(() => UserQuizArchiveModel, (archive) => archive.quizSet)
  archiveList: UserQuizArchiveModel[];

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
