import { ApiProperty } from '@nestjs/swagger';

/** Swagger/응답용 Post 스키마 (목록·단건 공통) */
export class PostResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  summary: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiProperty()
  published: boolean;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  created_at: string;

  @ApiProperty()
  updated_at: string;

  @ApiProperty({ nullable: true })
  deleted_at: string | null;
}
