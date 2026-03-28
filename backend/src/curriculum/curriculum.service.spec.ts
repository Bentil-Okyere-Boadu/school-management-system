import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CurriculumService } from './curriculum.service';
import { Curriculum } from './entities/curriculum.entity';
import { Topic } from './entities/topic.entity';
import { Subtopic } from './entities/subtopic.entity';
import { SubtopicCompletion } from './entities/subtopic-completion.entity';
import { CurriculumTopicNote } from './entities/curriculum-topic-note.entity';
import { Subject } from '../subject/subject.entity';
import { SubjectCatalog } from '../subject/subject-catalog.entity';
import { School } from '../school/school.entity';
import { AcademicTerm } from '../academic-calendar/entitites/academic-term.entity';
import { SchoolAdmin } from '../school-admin/school-admin.entity';

describe('CurriculumService', () => {
  let service: CurriculumService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurriculumService,
        {
          provide: getRepositoryToken(Curriculum),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Topic),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Subtopic),
          useValue: {},
        },
        {
          provide: getRepositoryToken(SubtopicCompletion),
          useValue: {},
        },
        {
          provide: getRepositoryToken(CurriculumTopicNote),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Subject),
          useValue: {},
        },
        {
          provide: getRepositoryToken(SubjectCatalog),
          useValue: {},
        },
        {
          provide: getRepositoryToken(School),
          useValue: {},
        },
        {
          provide: getRepositoryToken(AcademicTerm),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<CurriculumService>(CurriculumService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

describe('CurriculumService.duplicateTopicsToTerm', () => {
  let service: CurriculumService;
  let academicTermRepository: { findOne: jest.Mock };
  let topicRepository: {
    manager: { transaction: jest.Mock };
    find: jest.Mock;
  };
  let txTopicFind: jest.Mock;
  let txTopicSave: jest.Mock;
  let txTopicCreate: jest.Mock;
  let txSubtopicCreate: jest.Mock;
  let txCurriculumGetOne: jest.Mock;

  const schoolId = '11111111-1111-1111-1111-111111111111';
  const sourceTermId = '22222222-2222-2222-2222-222222222222';
  const targetTermId = '33333333-3333-3333-3333-333333333333';
  const topicId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

  const admin = {
    school: { id: schoolId },
  } as SchoolAdmin;

  const termRow = (id: string) => ({
    id,
    academicCalendar: { school: { id: schoolId } },
  });

  beforeEach(async () => {
    txTopicFind = jest.fn();
    txTopicSave = jest.fn();
    txTopicCreate = jest.fn((partial: Record<string, unknown>) => ({
      ...partial,
    }));
    txSubtopicCreate = jest.fn((partial: Record<string, unknown>) => ({
      ...partial,
    }));
    txCurriculumGetOne = jest.fn();

    const txTopicRepo = {
      find: txTopicFind,
      save: txTopicSave,
      create: txTopicCreate,
      createQueryBuilder: jest.fn(),
    };

    const txSubtopicRepo = {
      create: txSubtopicCreate,
    };

    const txCurriculumQb = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: txCurriculumGetOne,
    };

    const txCurriculumRepo = {
      createQueryBuilder: jest.fn(() => txCurriculumQb),
    };

    academicTermRepository = {
      findOne: jest.fn(),
    };

    const mockTransactionalManager = {
      getRepository: (ent: unknown) => {
        if (ent === Topic) return txTopicRepo;
        if (ent === Subtopic) return txSubtopicRepo;
        if (ent === Curriculum) return txCurriculumRepo;
        return {};
      },
      createQueryBuilder: jest.fn((entity: unknown) => {
        if (entity === Curriculum) return txCurriculumQb;
        throw new Error('Unexpected createQueryBuilder entity in test mock');
      }),
    };

    topicRepository = {
      manager: {
        transaction: jest.fn(async (fn: (m: unknown) => Promise<string[]>) =>
          fn(mockTransactionalManager),
        ),
      },
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurriculumService,
        { provide: getRepositoryToken(Curriculum), useValue: {} },
        { provide: getRepositoryToken(Topic), useValue: topicRepository },
        { provide: getRepositoryToken(Subtopic), useValue: {} },
        { provide: getRepositoryToken(SubtopicCompletion), useValue: {} },
        { provide: getRepositoryToken(CurriculumTopicNote), useValue: {} },
        { provide: getRepositoryToken(Subject), useValue: {} },
        { provide: getRepositoryToken(SubjectCatalog), useValue: {} },
        { provide: getRepositoryToken(School), useValue: {} },
        {
          provide: getRepositoryToken(AcademicTerm),
          useValue: academicTermRepository,
        },
      ],
    }).compile();

    service = module.get<CurriculumService>(CurriculumService);
  });

  it('rejects when source and target term are the same', async () => {
    await expect(
      service.duplicateTopicsToTerm(
        {
          sourceAcademicTermId: sourceTermId,
          targetAcademicTermId: sourceTermId,
          topicIds: [topicId],
        },
        admin,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects duplicateAllFromSource together with topicIds', async () => {
    academicTermRepository.findOne
      .mockResolvedValueOnce(termRow(sourceTermId))
      .mockResolvedValueOnce(termRow(targetTermId));

    await expect(
      service.duplicateTopicsToTerm(
        {
          sourceAcademicTermId: sourceTermId,
          targetAcademicTermId: targetTermId,
          duplicateAllFromSource: true,
          topicIds: [topicId],
        },
        admin,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws when a topic id is missing', async () => {
    academicTermRepository.findOne
      .mockResolvedValueOnce(termRow(sourceTermId))
      .mockResolvedValueOnce(termRow(targetTermId));

    txTopicFind.mockResolvedValueOnce([]);

    await expect(
      service.duplicateTopicsToTerm(
        {
          sourceAcademicTermId: sourceTermId,
          targetAcademicTermId: targetTermId,
          topicIds: [topicId],
        },
        admin,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws when topic is not in the source term', async () => {
    academicTermRepository.findOne
      .mockResolvedValueOnce(termRow(sourceTermId))
      .mockResolvedValueOnce(termRow(targetTermId));

    const wrongTermTopic = {
      id: topicId,
      subjectCatalog: { school: { id: schoolId } },
      academicTerm: { id: '99999999-9999-9999-9999-999999999999' },
      curriculum: null,
      subtopics: [],
    };
    txTopicFind.mockResolvedValueOnce([wrongTermTopic]);

    await expect(
      service.duplicateTopicsToTerm(
        {
          sourceAcademicTermId: sourceTermId,
          targetAcademicTermId: targetTermId,
          topicIds: [topicId],
        },
        admin,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws when topic belongs to another school', async () => {
    academicTermRepository.findOne
      .mockResolvedValueOnce(termRow(sourceTermId))
      .mockResolvedValueOnce(termRow(targetTermId));

    const otherSchoolTopic = {
      id: topicId,
      subjectCatalog: {
        school: { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' },
      },
      academicTerm: { id: sourceTermId },
      curriculum: null,
      subtopics: [],
    };
    txTopicFind.mockResolvedValueOnce([otherSchoolTopic]);

    await expect(
      service.duplicateTopicsToTerm(
        {
          sourceAcademicTermId: sourceTermId,
          targetAcademicTermId: targetTermId,
          topicIds: [topicId],
        },
        admin,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('creates copies with null plan dates and copies subtopics', async () => {
    academicTermRepository.findOne
      .mockResolvedValueOnce(termRow(sourceTermId))
      .mockResolvedValueOnce(termRow(targetTermId));

    const sourceTopic = {
      id: topicId,
      name: 'Algebra',
      description: 'desc',
      order: 2,
      plannedStartDate: new Date('2025-01-01'),
      plannedEndDate: new Date('2025-02-01'),
      subjectCatalog: {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        school: { id: schoolId },
      },
      academicTerm: { id: sourceTermId },
      curriculum: null,
      subtopics: [
        {
          name: 'Sub A',
          description: 'd',
          createdAt: new Date('2020-01-01'),
        },
      ],
    };

    txTopicFind.mockResolvedValueOnce([sourceTopic]);
    txCurriculumGetOne.mockResolvedValue(null);
    txTopicSave.mockImplementation((row: Record<string, unknown>) =>
      Promise.resolve({
        ...row,
        id: 'new-topic-id',
      }),
    );

    const reloadedTopic = {
      id: 'new-topic-id',
      name: 'Algebra',
      description: 'desc',
      order: 2,
      plannedStartDate: null,
      plannedEndDate: null,
      subjectCatalog: {
        id: sourceTopic.subjectCatalog.id,
        school: { id: schoolId },
      },
      curriculum: null,
      academicTerm: { id: targetTermId, startDate: null, endDate: null },
      subtopics: [],
    };

    topicRepository.find.mockResolvedValueOnce([reloadedTopic]);

    const result = await service.duplicateTopicsToTerm(
      {
        sourceAcademicTermId: sourceTermId,
        targetAcademicTermId: targetTermId,
        topicIds: [topicId],
      },
      admin,
    );

    expect(result.createdCount).toBe(1);
    expect(result.data[0].plannedStartDate).toBeNull();
    expect(result.data[0].plannedEndDate).toBeNull();
    expect(txTopicCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        plannedStartDate: null,
        plannedEndDate: null,
        name: 'Algebra',
        order: 2,
      }),
    );
    expect(txSubtopicCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Sub A',
        description: 'd',
        createdBy: 'admin',
      }),
    );
  });

  it('duplicateAllFromSource uses query builder and returns empty when none', async () => {
    academicTermRepository.findOne
      .mockResolvedValueOnce(termRow(sourceTermId))
      .mockResolvedValueOnce(termRow(targetTermId));

    const qb = {
      innerJoin: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    // Replace transaction mock for this test only
    const module = await Test.createTestingModule({
      providers: [
        CurriculumService,
        { provide: getRepositoryToken(Curriculum), useValue: {} },
        {
          provide: getRepositoryToken(Topic),
          useValue: {
            ...topicRepository,
            manager: {
              transaction: jest.fn((fn: (m: unknown) => Promise<string[]>) => {
                const txTopicRepoInner = {
                  find: jest.fn().mockResolvedValue([]),
                  save: jest.fn(),
                  create: jest.fn((x: Record<string, unknown>) => ({
                    ...x,
                  })),
                  createQueryBuilder: jest.fn(() => qb),
                };
                const curriculumQb = {
                  innerJoin: jest.fn().mockReturnThis(),
                  where: jest.fn().mockReturnThis(),
                  andWhere: jest.fn().mockReturnThis(),
                  getOne: jest.fn().mockResolvedValue(null),
                };
                return fn({
                  getRepository: (ent: unknown) => {
                    if (ent === Topic) return txTopicRepoInner;
                    if (ent === Subtopic) {
                      return {
                        create: jest.fn((x: Record<string, unknown>) => ({
                          ...x,
                        })),
                      };
                    }
                    if (ent === Curriculum) {
                      return {
                        createQueryBuilder: jest.fn(() => curriculumQb),
                      };
                    }
                    return {};
                  },
                  createQueryBuilder: jest.fn((entity: unknown) => {
                    if (entity === Curriculum) return curriculumQb;
                    throw new Error(
                      'Unexpected createQueryBuilder entity in test mock',
                    );
                  }),
                });
              }),
            },
          },
        },
        { provide: getRepositoryToken(Subtopic), useValue: {} },
        { provide: getRepositoryToken(SubtopicCompletion), useValue: {} },
        { provide: getRepositoryToken(CurriculumTopicNote), useValue: {} },
        { provide: getRepositoryToken(Subject), useValue: {} },
        { provide: getRepositoryToken(SubjectCatalog), useValue: {} },
        { provide: getRepositoryToken(School), useValue: {} },
        {
          provide: getRepositoryToken(AcademicTerm),
          useValue: academicTermRepository,
        },
      ],
    }).compile();

    const svc = module.get<CurriculumService>(CurriculumService);
    const res = await svc.duplicateTopicsToTerm(
      {
        sourceAcademicTermId: sourceTermId,
        targetAcademicTermId: targetTermId,
        duplicateAllFromSource: true,
      },
      admin,
    );

    expect(res.createdCount).toBe(0);
    expect(res.data).toEqual([]);
    expect(qb.getMany).toHaveBeenCalled();
  });
});
