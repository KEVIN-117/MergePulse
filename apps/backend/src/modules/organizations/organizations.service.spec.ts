import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsService } from './organizations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

describe('OrganizationsService', () => {
  let service: OrganizationsService;

  const prismaMock = {
    organization: {
      upsert: jest.fn(),
    },
  };

  const configServiceMock = {
    get: jest.fn((key: string) => {
      if (key === 'GITHUB_APP_PRIVATE_KEY') return 'private-key';
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrganizationsService, { provide: PrismaService, useValue: prismaMock }, { provide: ConfigService, useValue: configServiceMock }],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an organization', async () => {
    console.log("test");
  });
});
