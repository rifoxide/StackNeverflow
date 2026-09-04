import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { envValidationSchema } from './config/env.validation.js';
import { AppController } from './app.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [join(__dirname, '**/*.entity{.ts,.js}')],
        migrations: [join(__dirname, 'database/migrations/*{.ts,.js}')],
        synchronize: false,
        autoLoadEntities: true,
      }),
    }),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
