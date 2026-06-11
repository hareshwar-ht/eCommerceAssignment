const bcrypt = require('bcrypt');
const pool = require('../../src/config/database');
const refreshTokenModel = require('../../src/models/refreshTokenModel');

jest.mock('../../src/config/database', () => {
  return {
    query: jest.fn()
  };
});

describe('Refresh Token Model', () => {
  beforeAll(() => {
    process.env.REFRESH_TOKEN_EXPIRES_MS = '604800000';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should insert a refresh token hash', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: '1' }] });
      const result = await refreshTokenModel.create('user-123', 'token-abc');
      
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO refresh_tokens'),
        ['user-123', expect.any(String), expect.any(Date)]
      );
      expect(result).toEqual({ id: '1' });
    });
  });

  describe('findByUserId', () => {
    it('should find token array by user ID', async () => {
      const mockTokens = [{ token_hash: 'hash-123' }];
      pool.query.mockResolvedValue({ rows: mockTokens });
      const result = await refreshTokenModel.findByUserId('user-123');
      expect(result).toEqual(mockTokens);
    });
  });

  describe('verifyToken', () => {
    it('should compare plain token with hash', async () => {
      const hash = await bcrypt.hash('token-abc', 10);
      const result = await refreshTokenModel.verifyToken('token-abc', hash);
      expect(result).toBe(true);
    });

    it('should fail comparing incorrect token with hash', async () => {
      const hash = await bcrypt.hash('token-abc', 10);
      const result = await refreshTokenModel.verifyToken('wrong-token', hash);
      expect(result).toBe(false);
    });
  });

  describe('deleteByUserId', () => {
    it('should delete token by user ID', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      await refreshTokenModel.deleteByUserId('user-123');
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM refresh_tokens WHERE user_id ='),
        ['user-123']
      );
    });
  });

  describe('deleteAllExpired', () => {
    it('should delete expired tokens', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      await refreshTokenModel.deleteAllExpired();
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM refresh_tokens WHERE expires_at <= NOW()')
      );
    });
  });
});
