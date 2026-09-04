import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { User } from '../users/user.entity.js';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;

  const mockUsersService = {
    create: vi.fn(),
    findByEmail: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should create a new user', async () => {
      const registerDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const createdUser = {
        id: '1',
        name: registerDto.name,
        email: registerDto.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;

      mockUsersService.create.mockResolvedValue(createdUser);

      const result = await service.register(registerDto);

      expect(usersService.create).toHaveBeenCalledWith(
        registerDto.name,
        registerDto.email,
        registerDto.password,
      );
      expect(result).toEqual(createdUser);
    });

    it('should propagate ConflictException from UsersService', async () => {
      const registerDto = {
        name: 'Test',
        email: 'existing@example.com',
        password: 'password123',
      };

      mockUsersService.create.mockRejectedValue(
        new ConflictException('Email already in use'),
      );

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
