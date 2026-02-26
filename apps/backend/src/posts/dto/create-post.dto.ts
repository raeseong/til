import { IsString, IsBoolean, IsArray, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty()
  @IsString()
  summary: string;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiProperty({ type: [String], example: ['javascript', 'til'] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  published?: boolean;
}
