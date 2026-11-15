import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ClassConstructor } from 'class-transformer';
import { RESPONSE_DTO_KEY } from '../constant.ts';

export const ValidateResponse = <T>(dto: ClassConstructor<T>) => {
  return applyDecorators(SetMetadata(RESPONSE_DTO_KEY, dto));
};
