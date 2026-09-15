import { Module } from '@nestjs/common';
import { OutboxWorker } from './outbox.worker';
import { MatchmakingWorker } from './matchmaking.worker';
import { GatewayModule } from '../gateway/gateway.module';
import { RidesModule } from '../rides/rides.module';

@Module({
    imports: [GatewayModule, RidesModule],
    providers: [OutboxWorker, MatchmakingWorker],
})
export class WorkersModule { }
