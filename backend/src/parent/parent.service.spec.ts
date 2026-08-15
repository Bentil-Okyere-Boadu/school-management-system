import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ParentService } from './parent.service';
import { Parent } from './parent.entity';
import { ParentStudent } from './parent-student.entity';
import { ParentLinkService } from './parent-link.service';

describe('ParentService', () => {
  let service: ParentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParentService,
        { provide: getRepositoryToken(Parent), useValue: {} },
        { provide: getRepositoryToken(ParentStudent), useValue: {} },
        { provide: ParentLinkService, useValue: {} },
      ],
    }).compile();

    service = module.get<ParentService>(ParentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
