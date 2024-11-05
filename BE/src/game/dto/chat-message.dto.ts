import { IsString, Length } from 'class-validator';

export class ChatMessageDto {
  @IsString()
  @Length(6, 6, { message: 'PIN번호는 6자리이어야 합니다.' })
  gameId: string;

  // TODO: 메시지 길이 제한 두기
  @IsString()
  message: string;
}
