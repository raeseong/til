import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PostsRepository } from './posts.repository';

@Module({
  imports: [AuthModule],
  controllers: [PostsController],
  providers: [PostsService, PostsRepository],
})
export class PostsModule {}
