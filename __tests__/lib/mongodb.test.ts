import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';

// mongooseのモック
jest.mock('mongoose', () => ({
  connect: jest.fn(),
}));

// global.mongooseのモック
declare global {
  var mongoose: any;
}

describe('dbConnect', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // global.mongooseをリセット
    global.mongoose = undefined;
    // 環境変数をリセット
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('初回接続時にmongoose.connectを呼び出す', async () => {
    const mockConnection = { connection: 'mocked' };
    (mongoose.connect as jest.Mock).mockResolvedValue(mockConnection);

    const result = await dbConnect();

    expect(mongoose.connect).toHaveBeenCalledWith(
      'mongodb://localhost:27017/board_app',
      { bufferCommands: false }
    );
    expect(result).toBe(mockConnection);
    expect(global.mongoose).toEqual({
      conn: mockConnection,
      promise: expect.any(Promise),
    });
  });

  it('MONGODB_URI環境変数が設定されている場合、それを使用する', async () => {
    process.env.MONGODB_URI = 'mongodb://custom:27017/test_db';
    const mockConnection = { connection: 'mocked' };
    (mongoose.connect as jest.Mock).mockResolvedValue(mockConnection);

    await dbConnect();

    expect(mongoose.connect).toHaveBeenCalledWith(
      'mongodb://custom:27017/test_db',
      { bufferCommands: false }
    );
  });

  it('既に接続がキャッシュされている場合、再接続しない', async () => {
    const mockConnection = { connection: 'cached' };
    global.mongoose = {
      conn: mockConnection,
      promise: Promise.resolve(mockConnection),
    };

    const result = await dbConnect();

    expect(mongoose.connect).not.toHaveBeenCalled();
    expect(result).toBe(mockConnection);
  });

  it('接続プロミスがキャッシュされている場合、それを再利用する', async () => {
    const mockConnection = { connection: 'mocked' };
    const mockPromise = Promise.resolve(mockConnection);
    global.mongoose = {
      conn: null,
      promise: mockPromise,
    };

    const result = await dbConnect();

    expect(mongoose.connect).not.toHaveBeenCalled();
    expect(result).toBe(mockConnection);
  });

  it('接続に失敗した場合、エラーをスローし、プロミスをリセットする', async () => {
    const mockError = new Error('接続エラー');
    (mongoose.connect as jest.Mock).mockRejectedValue(mockError);

    await expect(dbConnect()).rejects.toThrow('接続エラー');
    
    expect(global.mongoose?.promise).toBeNull();
  });

  it('複数の同時接続要求がある場合、同じプロミスを共有する', async () => {
    const mockConnection = { connection: 'mocked' };
    let resolveConnect: (value: any) => void;
    const connectPromise = new Promise((resolve) => {
      resolveConnect = resolve;
    });
    
    (mongoose.connect as jest.Mock).mockReturnValue(connectPromise);

    // 3つの同時接続要求
    const promise1 = dbConnect();
    const promise2 = dbConnect();
    const promise3 = dbConnect();

    // mongoose.connectは1回だけ呼ばれるべき
    expect(mongoose.connect).toHaveBeenCalledTimes(1);

    // 接続を解決
    resolveConnect!(mockConnection);

    const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);

    // すべて同じ接続を返すべき
    expect(result1).toBe(mockConnection);
    expect(result2).toBe(mockConnection);
    expect(result3).toBe(mockConnection);
  });
});