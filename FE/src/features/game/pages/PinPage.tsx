import { socketService, useSocketEvent } from '@/api/socket';
import { Header } from '@/components/Header';
import { TextInput } from '@/components/TextInput';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../../../components/CustomButton';

export const PinPage = () => {
  const [pin, setPin] = useState('');
  const [errors, setErrors] = useState({ nickname: '', pin: '' });
  const navigate = useNavigate();

  useSocketEvent('joinRoom', () => {
    navigate(`/game/${pin}`);
  });

  const handleJoin = () => {
    const newErrors = { nickname: '', pin: '' };
    let hasError = false;

    if (!pin.trim()) {
      newErrors.pin = '핀번호를 입력해주세요';
      hasError = true;
    }

    setErrors(newErrors);

    if (hasError) return;

    socketService.joinRoom(pin);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-300 to-indigo-500">
      <Header />
      <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg border-4 border-blue-400">
        <h2 className="text-2xl font-bold text-center text-blue-500 mb-6">PIN 번호로 입장</h2>
        <TextInput
          label="핀번호"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            if (errors.pin) setErrors((prev) => ({ ...prev, pin: '' }));
          }}
          error={errors.pin}
        />
        <CustomButton text="들어가기" onClick={handleJoin} />
      </div>
    </div>
  );
};
