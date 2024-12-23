/**
 * @fileoverview Functional batch processor factory
 */
import { Namespace } from 'socket.io';
import { Logger } from '@nestjs/common';

interface BatchData {
  gameId: string;
  data: any;
}

/**
 * Creates a batch processor instance
 */
export function createBatchProcessor(server: Namespace, eventName: string) {
  const logger = new Logger(`BatchProcessor:${eventName}`);
  // 이 변수들은 클로저에 의해 보호됨
  const batchMap = new Map<string, any[]>();
  let isProcessing = false;

  /**
   * Pushes data to batch queue
   */
  const pushData = (gameId: string, data: any) => {
    if (!batchMap.has(gameId)) {
      batchMap.set(gameId, []);
    }
    batchMap.get(gameId).push(data);
  };

  /**
   * Processes and emits all batched data
   */
  const processBatch = () => {
    if (isProcessing) {
      return;
    }

    isProcessing = true;
    try {
      batchMap.forEach((queue, gameId) => {
        if (queue.length > 0) {
          const batch = queue.splice(0, queue.length);
          server.to(gameId).emit(eventName, batch);
          logger.debug(`Processed ${batch.length} items for game ${gameId}`);
        }
      });
    } catch (error) {
      logger.error(`Error processing batch: ${error.message}`);
    } finally {
      isProcessing = false;
    }
  };

  /**
   * Starts automatic batch processing
   */
  const startProcessing = (interval: number = 100) => {
    setInterval(processBatch, interval);
    logger.verbose(`Started batch processor for ${eventName} with ${interval}ms interval`);
  };

  /**
   * Clears all batched data
   */
  const clear = () => {
    batchMap.clear();
  };

  // 외부에서 사용할 수 있는 public 메서드만 노출
  return {
    pushData,
    processBatch,
    startProcessing,
    clear
  };
}
