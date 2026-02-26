import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * 페이지네이션 요청 DTO
 * 컨트롤러에서 @Query()로 사용
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: '페이지 번호',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Transform(({ value }) => value ?? 1)
  page?: number;

  @ApiPropertyOptional({
    description: '페이지당 항목 수',
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => value ?? 10)
  pageSize?: number;

  /**
   * page/pageSize를 skip/take로 변환
   */
  toSkipTake(): { skip: number; take: number } {
    const page = this.page ?? 1;
    const pageSize = this.pageSize ?? 10;
    return {
      skip: (page - 1) * pageSize,
      take: pageSize,
    };
  }
}

export class PaginationMetaDto {
  @ApiProperty({
    description: '현재 페이지 번호',
    minimum: 1,
  })
  page: number;

  @ApiProperty({
    description: '페이지당 항목 수',
    minimum: 1,
  })
  pageSize: number;

  @ApiProperty({
    description: '전체 항목 수',
    minimum: 0,
  })
  totalCount: number;

  @ApiProperty({
    description: '전체 페이지 수',
    minimum: 0,
  })
  totalPage: number;
}

export type PaginatedResponseDto<T> = {
  pagination: PaginationMetaDto;
  list: T[];
};

/**
 * 페이지네이션 응답 DTO 팩토리
 * Swagger가 제네릭을 인식할 수 있도록 동적으로 클래스 생성
 *
 * @example
 * // DTO 파일에서
 * export class PostListResponseDto extends createPaginatedResponseDto(PostResponseDto) {}
 *
 * // 컨트롤러에서
 * @ApiOkResponse({ status: 200, type: PostListResponseDto })
 */
export function createPaginatedResponseDto<T>(ItemDto: new () => T): new () => PaginatedResponseDto<T> {
  class PaginatedResponse {
    @ApiProperty({
      description: '페이지네이션 정보',
      type: PaginationMetaDto,
    })
    pagination: PaginationMetaDto;

    @ApiProperty({
      description: '데이터 목록',
      type: [ItemDto],
    })
    list: T[];
  }

  return PaginatedResponse as new () => PaginatedResponseDto<T>;
}

/** pagination 메타 생성 헬퍼 */
export function buildPaginationMeta(
  page: number,
  pageSize: number,
  totalCount: number,
): PaginationMetaDto {
  return {
    page,
    pageSize,
    totalCount,
    totalPage: Math.ceil(totalCount / pageSize) || 0,
  };
}
