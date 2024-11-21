import {
  Button,
  Slider,
  Switch,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import { useEffect, useState } from 'react';
import { socketService, useSocketEvent } from '@/api/socket';
import RoomConfig from '@/constants/roomConfig';
import { useNavigate } from 'react-router-dom';
import { useRoomStore } from '@/store/useRoomStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { TextInput } from '@/components/TextInput';
export const GameSetupPage = () => {
  const { updateRoom } = useRoomStore((state) => state);
  const setIsHost = usePlayerStore((state) => state.setIsHost);
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const [maxPlayerCount, setMaxPlayerCount] = useState<number>(RoomConfig.DEFAULT_PLAYERS);
  const [gameMode, setGameMode] = useState<'SURVIVAL' | 'RANKING'>('RANKING');
  const [roomPublic, setRoomPublic] = useState(true);
  const navigate = useNavigate();

  useSocketEvent('createRoom', (data) => {
    navigate(`/game/${data.gameId}`);
  });

  useEffect(() => {
    socketService.disconnect();
  }, []);

  const handleTitleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setTitle(e.target.value);
    setTitleError('');
  };

  const handleModeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === 'RANKING' ? 'RANKING' : 'SURVIVAL';
    setGameMode(value);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setTitleError('제목을 입력해 주세요');
      return;
    }
    const roomData = {
      title,
      maxPlayerCount,
      gameMode,
      isPublic: roomPublic
    };
    setIsHost(true);
    updateRoom(roomData);
    socketService.createRoom(roomData);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[url('https://ideogram.ai/assets/progressive-image/balanced/response/0cBdPh08SZeUCMBKoMs9Aw')] bg-cover bg-center">
      <div className="w-full max-w-lg p-8 bg-white shadow-lg rounded-lg border-4 border-blue-400">
        <Button
          variant="outlined"
          onClick={() => navigate('/')}
          className="mb-4 text-blue-500 border-blue-500 hover:bg-blue-500 hover:text-white transition-all"
        >
          {'<'} 뒤로가기
        </Button>
        <TextInput
          value={title}
          label="게임방 제목"
          onChange={handleTitleChange}
          error={titleError}
        />
        <div className="mt-4 mb-4 flex items-center justify-between">
          <span className="text-blue-500">최대인원</span>
          <span className="text-blue-500 font-bold">{maxPlayerCount}</span>
        </div>
        <Slider
          min={RoomConfig.MIN_PLAYERS}
          max={RoomConfig.MAX_PLAYERS}
          step={1}
          value={maxPlayerCount}
          onChange={(_, newValue) => setMaxPlayerCount(newValue as number)}
          className="w-full mb-4"
          sx={{
            '& .MuiSlider-thumb': {
              backgroundColor: '#1E40AF' // 파란색 슬라이더 thumb
            }
          }}
        />
        <FormControl component="fieldset" className="mb-4">
          <FormLabel component="legend" className="text-blue-500">
            게임 모드 선택
          </FormLabel>
          <RadioGroup
            aria-labelledby="game-mode-radio-group"
            value={gameMode}
            onChange={handleModeChange}
            name="game-mode-radio-group"
          >
            <FormControlLabel value="SURVIVAL" control={<Radio />} label="서바이벌" />
            <FormControlLabel value="RANKING" control={<Radio />} label="랭킹" />
          </RadioGroup>
          <FormLabel component="legend" className="text-blue-500">
            방 공개 여부
          </FormLabel>
          <Switch
            checked={roomPublic}
            onChange={(_, newValue) => setRoomPublic(newValue)}
            defaultChecked
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: '#1E40AF' // 파란색 스위치
              },
              '& .MuiSwitch-track': {
                backgroundColor: '#1E40AF'
              }
            }}
          />
        </FormControl>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          className="w-full bg-blue-500 text-white hover:bg-blue-600 transition-all"
        >
          방 만들기
        </Button>
      </div>
    </div>
  );
};
