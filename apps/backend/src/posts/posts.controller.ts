import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiOkResponse } from '@nestjs/swagger';
import { PaginationQueryDto, createPaginatedResponseDto } from '../common/dto/pagination.dto';
import { PostResponseDto } from './dto/post-response.dto';

const PostListResponseDto = createPaginatedResponseDto(PostResponseDto);

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({ summary: '공개 글 목록 (published만, 페이지네이션)' })
  @ApiOkResponse({ type: PostListResponseDto })
  findPublished(@Query() query: PaginationQueryDto) {
    return this.postsService.findPublishedPaginated(query);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('admin/all')
  @ApiOperation({ summary: '전체 글 목록 (관리자, 페이지네이션)' })
  @ApiOkResponse({ type: PostListResponseDto })
  findAllAdmin(@Query() query: PaginationQueryDto) {
    return this.postsService.findAllAdminPaginated(query);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('admin/:id')
  @ApiOperation({ summary: '글 단건 조회 (관리자)' })
  @ApiParam({ name: 'id', type: Number })
  async findById(@Param('id', ParseIntPipe) id: number) {
    const post = await this.postsService.findById(id);
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  @Get(':slug')
  @ApiOperation({ summary: 'slug로 공개 글 조회' })
  @ApiParam({ name: 'slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.postsService.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: '글 생성' })
  create(@Body() dto: CreatePostDto) {
    return this.postsService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put(':id')
  @ApiOperation({ summary: '글 수정' })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePostDto) {
    return this.postsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '글 삭제 (soft)' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.remove(id);
  }
}
