import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { QuizSetService } from './service/quiz-set.service';
import { UpdateQuizSetDto } from './dto/update-quiz.dto';
import { CreateQuizSetDto } from './dto/create-quiz.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserModel } from '../user/entities/user.entity';
import { ParseIntOrDefault } from '../common/decorators/parse-int-or-default.decorator';

@Controller('/api/quizset')
export class QuizSetController {
  private readonly logger = new Logger(QuizSetController.name);

  constructor(private readonly quizService: QuizSetService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: '퀴즈셋 생성' })
  @ApiResponse({ status: 201, description: '퀴즈셋이 성공적으로 생성됨' })
  @ApiResponse({ status: 400, description: '잘못된 입력값' })
  async createQuizSet(@Body() createQuizSetDto: CreateQuizSetDto, @CurrentUser() user: UserModel) {
    const result = await this.quizService.createQuizSet(createQuizSetDto, user);
    this.logger.verbose(`퀴즈셋 생성: ${result}`);
    return result;
  }

  @Get()
  async findAll(
    @Query('category', new DefaultValuePipe('')) category: string,
    @Query('cursor', new ParseIntOrDefault(1)) cursor: number,
    @Query('take', new ParseIntOrDefault(10)) take: number,
    @Query('search', new DefaultValuePipe('')) search: string
  ) {
    const start = Date.now();
    const result = await this.quizService.findAllWithQuizzesAndChoices(
      category,
      cursor,
      take,
      search
    );
    const end = Date.now();
    this.logger.verbose(`퀴즈셋 목록 조회: ${result}, ${end - start}ms`);
    // this.logger.verbose(`퀴즈셋 목록 조회: ${result}`);
    return result;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.quizService.findOne(+id);
    this.logger.verbose(`퀴즈셋 조회: ${result}`);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateQuizSetDto: UpdateQuizSetDto,
    @CurrentUser() user: UserModel
  ) {
    const result = await this.quizService.update(+id, updateQuizSetDto, user);
    this.logger.verbose(`퀴즈셋 수정: ${result}`);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: UserModel) {
    this.logger.verbose(`퀴즈셋 삭제: ${id}`);
    return this.quizService.remove(+id, user);
  }
}
