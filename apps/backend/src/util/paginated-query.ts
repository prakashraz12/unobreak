import {
  Repository,
  FindOptionsWhere,
  FindOptionsOrder,
  FindOptionsRelations,
  ObjectLiteral,
  Between,
} from 'typeorm';
import {
  clampPageSize,
  PaginationResponseDTO,
} from '../common/dto/pagination.dto.ts';
import { getPaginationResponse } from '../common/utils/get-peginated-response.ts';

export interface PaginationFilter {
  page?: number;
  take?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationResponseDTO;
}

export interface PaginatedQueryOptions<
  Entity extends ObjectLiteral,
  MappedDTO,
> {
  repository: Repository<Entity>;

  where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[];

  /** Pagination/search filter from the request */
  filter: PaginationFilter;

  /** Map each entity row to your DTO shape */
  map: (entity: Entity) => MappedDTO;

  /** Optional: override sort order (default: createdAt DESC) */
  order?: FindOptionsOrder<Entity>;

  /** Optional: eager-load relations */
  relations?: FindOptionsRelations<Entity>;
}

export async function paginatedQuery<Entity extends ObjectLiteral, MappedDTO>(
  options: PaginatedQueryOptions<Entity, MappedDTO>,
): Promise<PaginatedResponse<MappedDTO>> {
  const { repository, where, filter, map, order, relations } = options;

  const page = Math.max(filter.page ?? 0, 0);
  const take = clampPageSize(filter.take);

  const hasDateFilter = filter.startDate && filter.endDate;

  const dateFilter = hasDateFilter
    ? {
        createdAt: Between(
          new Date(filter.startDate!),
          new Date(filter.endDate!),
        ),
      }
    : {};

  const baseWhere = Array.isArray(where)
    ? where.map((w) => ({
        ...w,
        ...dateFilter,
      }))
    : {
        ...where,
        ...dateFilter,
      };

  const [rows, total] = await repository.findAndCount({
    where: baseWhere,
    take,
    skip: page * take,
    order:
      order ?? ({ createdAt: 'DESC' } as unknown as FindOptionsOrder<Entity>),

    ...(relations ? { relations } : {}),
  });

  return {
    data: rows.map(map),
    pagination: getPaginationResponse(rows, total, { page, take }),
  };
}
