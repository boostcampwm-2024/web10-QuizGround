import { IsString, Length } from 'class-validator';

export class JoinRoomDto {
  @IsString()
  @Length(6, 6, { message: 'PIN번호는 6자리이어야 합니다.' })
  gameId: string;

  @IsString()
  playerName: string;
}
