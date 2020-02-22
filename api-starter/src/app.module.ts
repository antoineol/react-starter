import { Logger, Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppResolver } from './app.resolver';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AuthorsModule } from './author/author.module';
import { env } from './environment/env';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    GraphQLModule.forRoot({
      debug: env.isDev,
      playground: !env.isProd,
      autoSchemaFile: 'schema.graphql',
      // buildSchemaOptions
    }),
    UserModule,
    AuthModule,
    // AuthorsModule,
  ],
  controllers: [AppController],
  providers: [AppService, Logger, AppResolver],
})
export class AppModule {
}