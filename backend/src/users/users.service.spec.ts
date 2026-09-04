import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { User } from './user.entity.js';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;

  const mockRepository = {
    findOne: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should return a user if found', async () => {
      const mockUser = { id: '1', email: 'test@example.com' } as User;
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user if found', async () => {
      const mockUser = { id: '1', email: 'test@example.com' } as User;
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById('1');

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const name = 'John Doe';
      const email = 'john@example.com';
      const password = 'password123';

      mockRepository.findOne.mockResolvedValue(null); // No existing user
      mockRepository.create.mockReturnValue({
        name,
        email,
        passwordHash: 'hashed',
        refreshTokenHash: null,
      });
      mockRepository.save.mockResolvedValue({
        id: '1',
        name,
        email,
        passwordHash: 'hashed',
        refreshTokenHash: null,
      } as User);

      const result = await service.create(name, email, password);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.email).toBe(email);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockRepository.findOne.mockResolvedValue({
        id: '1',
        email: 'existing@example.com',
      } as User);

      await expect(
        service.create('Test', 'existing@example.com', 'password'),
      ).rejects.toThrow(ConflictException);
    });

    it('should hash password with bcrypt (12 rounds)', async () => {
      const password = 'plaintext123';
      mockRepository.findOne.mockResolvedValue(null);

      let capturedHash: string | undefined;
      mockRepository.create.mockImplementation((data) => {
        capturedHash = data.passwordHash;
        return data as User;
      });
      mockRepository.save.mockResolvedValue({ id: '1' } as User);

      await service.create('Test', 'test@example.com', password);

      // Verify bcrypt hash was created (starts with $2b$ and has correct structure)
      expect(capturedHash).toBeDefined();
      expect(capturedHash).toMatch(/^\$2[aby]\$12\$/); // bcrypt format with 12 rounds

      // Verify hash can validate the original password
      const isValid = await bcrypt.compare(password, capturedHash!);
      expect(isValid).toBe(true);
    });
  });

  describe('updateRefreshToken', () => {
    it('should hash and store refresh token', async () => {
      const userId = '1';
      const refreshToken = 'some-refresh-token';

      await service.updateRefreshToken(userId, refreshToken);

      expect(mockRepository.update).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          refreshTokenHash: expect.any(String),
        }),
      );
    });

    it('should clear refresh token when null is passed', async () => {
      const userId = '1';

      await service.updateRefreshToken(userId, null);

      expect(mockRepository.update).toHaveBeenCalledWith(userId, {
        refreshTokenHash: null,
      });
    });
  });
});
