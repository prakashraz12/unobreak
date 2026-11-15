import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { FriendRelation } from '../../common/constant.ts';
import { NestedDTO } from '../../common/decorators/nested.decorator.ts';
import { IdDto } from '../../common/dto/id.dto.ts';
import { IntersectionType } from '@nestjs/swagger';
import {
  PaginationParamDTO,
  PaginationResponseDTO,
} from '../../common/dto/pagination.dto.ts';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  avatarId: number;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class GoogleLoginDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}

export class UserEntryListQueryDTO extends IntersectionType(
  PaginationParamDTO,
) {
  @IsString()
  @IsOptional()
  search?: string;
}

//response

export class UserCreatedDataDto extends IdDto {
  @IsString()
  accessToken: string;
}

export class UserCreateResponseDto {
  @IsString()
  message: string;

  @NestedDTO(UserCreatedDataDto)
  data: UserCreatedDataDto;
}

export class UserActivityDto {
  @IsBoolean()
  isOnline: boolean;

  @IsDateString()
  lastActive: Date;
}

export class UserResoponseDTO {
  @IsNumber()
  userId: number;

  @IsString()
  name: string;

  @IsNumber()
  avatarId: number;

  @IsOptional()
  @IsString()
  customProfileImage?: string | null;

  @NestedDTO(UserActivityDto)
  activity: UserActivityDto;

  /** Your relationship to this user (friend, pending, none). */
  @IsEnum(FriendRelation)
  @IsOptional()
  friendStatus?: FriendRelation;
}

export class UserListResponseDTO {
  @IsString()
  message: string;

  @NestedDTO(UserResoponseDTO, { isArray: true })
  data: UserResoponseDTO[];

  @IsObject()
  @IsOptional()
  pagination?: PaginationResponseDTO;
}
