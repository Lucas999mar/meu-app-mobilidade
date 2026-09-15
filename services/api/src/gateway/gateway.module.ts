import { Module } from '@nestjs/common';
import { RidesGateway } from './rides.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    providers: [RidesGateway],
    exports: [RidesGateway],
})
export class GatewayModule { }
