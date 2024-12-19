import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { QuizModel } from './quiz.entity';
import { BaseModel } from '../../common/entity/base.entity';

@Entity('quiz_choice')
export class QuizChoiceModel extends BaseModel {
  @Column({ name: 'quiz_id', type: 'bigint' })
  quizId: number;

  @Column({ name: 'is_answer', type: 'boolean', default: false })
  isAnswer: boolean;

  @Column({ name: 'choice_content', type: 'text' })
  @Index({
    fulltext: true,
    parser: 'ngram'
  })
  choiceContent: string;

  @Column({ name: 'choice_order', type: 'integer' })
  choiceOrder: number;

  @ManyToOne(() => QuizModel, (quiz) => quiz.choiceList, {
    onDelete: 'CASCADE',
    lazy: true
  })
  @JoinColumn({ name: 'quiz_id' })
  quiz: QuizModel;
}
