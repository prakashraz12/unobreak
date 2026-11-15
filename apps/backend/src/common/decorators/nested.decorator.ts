import { applyDecorators } from '@nestjs/common';
import {
  ClassConstructor,
  Transform,
  Type,
  plainToInstance,
} from 'class-transformer';
import { IsArray, IsObject, ValidateNested } from 'class-validator';
import { Optional } from './optional.decorator.ts';

type NestedDTOOptions = {
  optional?: boolean;
  isArray?: boolean;
  transform?: 'json' | 'number' | 'string';
};

export const NestedDTO = (
  dto: ClassConstructor<any>,
  options: NestedDTOOptions = {},
) => {
  const { isArray = false, transform, optional } = options;
  const decorators: PropertyDecorator[] = [];

  if (isArray) {
    decorators.push(IsArray());
    decorators.push(ValidateNested({ each: true }));
  } else {
    decorators.push(IsObject());
    decorators.push(ValidateNested({ each: false }));
  }

  if (optional) {
    decorators.push(Optional());
  }

  if (transform) {
    decorators.push(
      Transform(({ value, key, obj }) => {
        let transformedData: any;
        if (transform == 'json') {
          if (typeof value === 'string') {
            try {
              transformedData = JSON.parse(value);
            } catch (err) {
              console.error('Failed to parse json', value, key, obj, err);
              throw err;
            }
          } else {
            transformedData = value;
          }
        } else if (transform == 'number') {
          transformedData = Number(value);
        } else if (transform == 'string') {
          transformedData = String(value);
        }

        return plainToInstance(dto, transformedData);
      }),
    );
  } else {
    decorators.push(Type(() => dto));
  }

  return applyDecorators(...decorators);
};
