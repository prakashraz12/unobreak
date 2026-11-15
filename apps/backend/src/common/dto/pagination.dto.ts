import { Optional } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsInt, IsNumber, Max, Min } from 'class-validator';

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

/** Keeps an untrusted `take` inside the allowed window. */
export function clampPageSize(take?: number | null) {
  if (take == null || !Number.isFinite(take)) return DEFAULT_PAGE_SIZE;

  return Math.min(Math.max(Math.trunc(take), 1), MAX_PAGE_SIZE);
}

export class PaginationParamDTO {
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  @Optional()
  take: number | undefined;

  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsInt()
  @Min(0)
  @Optional()
  page: number | undefined;
}

export class PaginationResponseDTO {
  @IsNumber()
  @Optional()
  previousPage: number | null;

  @IsNumber()
  @Optional()
  nextPage: number | null;

  @IsNumber()
  total: number;

  @IsNumber()
  count: number;
}
