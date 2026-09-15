import { Module } from '@nestjs/common';
import { RidesService } from './rides.service';
import { RidesController } from './rides.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    controllers: [RidesController],
    providers: [RidesService],
    exports: [RidesService],
})
export class RidesModule { }
