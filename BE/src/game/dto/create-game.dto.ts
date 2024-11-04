import { IsString, IsInt, IsBoolean, Min, Max, IsIn, MaxLength, MinLength } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { GameConfig } from '../game.gateway';
import { WsException } from '@nestjs/websockets';

export class CreateGameDto implements GameConfig {
  @IsString()
  @MinLength(1, { message: '제목은 최소 1자 이상이어야 합니다' })
  @MaxLength(20, { message: '제목은 최대 20자까지 가능합니다' })
  title: string;

  @IsString()
  @IsIn(['ranking', 'survival'])
  gameMode: string;

  @IsInt()
  @Min(1)
  @Max(200)
  @Type(() => Number)
  maxPlayerCount: number;

  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === '1' || value === 1) return true;
    if (value === 'false' || value === '0' || value === 0) return false;
    throw new WsException({
      status: 'error',
      message: '잘못된 boolean 값입니다'
    });
  })
  isPublicGame: boolean;
}