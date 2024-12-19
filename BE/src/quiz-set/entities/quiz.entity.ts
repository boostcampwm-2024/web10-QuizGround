import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { BaseModel } from '../../common/entity/base.entity';
import { QuizSetModel } from './quiz-set.entity';
import { QuizChoiceModel } from './quiz-choice.entity';

@Entity('quiz')
export class QuizModel extends BaseModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'quiz_set_id' })
  quizSetId: number;

  @Column('text')
  @Index({
    fulltext: true,
    parser: 'ngram'
  })
  quiz: string;

  @Column({ name: 'limit_time' })
  limitTime: number;

  @ManyToOne(() => QuizSetModel, (quizSet) => quizSet.quizList, {
    lazy: true
  })
  @JoinColumn({ name: 'quiz_set_id' })
  quizSet: QuizSetModel;

  @OneToMany(() => QuizChoiceModel, (choice) => choice.quiz)
  choiceList: QuizChoiceModel[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
