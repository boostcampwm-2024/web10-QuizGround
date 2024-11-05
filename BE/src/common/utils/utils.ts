export function generateUniquePin(rooms) {
  let pin: string;
  let isUnique = false;
  let attempts = 0;
  const MAX_ATTEMPTS = 10; // 무한 루프 방지

  while (!isUnique && attempts < MAX_ATTEMPTS) {
    // 6자리 PIN 생성 (100000-999999)
    pin = Math.floor(100000 + Math.random() * 900000).toString();

    // 중복 체크
    const existingRoom = rooms.has(pin);

    if (!existingRoom) {
      isUnique = true;
    }

    attempts++;
  }

  if (!isUnique) {
    throw new Error('사용 가능한 PIN 생성 실패');
  }

  return pin;
}
