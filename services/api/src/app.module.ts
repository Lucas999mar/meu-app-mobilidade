import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { DatabaseModule } from './database/database.module';
import { GatewayModule } from './gateway/gateway.module';
import { AuthModule } from './auth/auth.module';
import { TariffsModule } from './tariffs/tariffs.module';
import { RidesModule } from './rides/rides.module';
import { DriversModule } from './drivers/drivers.module';
import { CustomersModule } from './customers/customers.module';
import { AdminModule } from './admin/admin.module';
import { WorkersModule } from './workers/workers.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env'],
        }),
        ScheduleModule.forRoot(),
        DatabaseModule,
        GatewayModule,
        AuthModule,
        TariffsModule,
        RidesModule,
        DriversModule,
        CustomersModule,
        AdminModule,
        WorkersModule, // Etapa 2
        PaymentsModule, // Etapa 5
    ],
})
export class AppModule { }
