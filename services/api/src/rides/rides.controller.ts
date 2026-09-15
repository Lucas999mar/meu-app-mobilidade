import {
    Controller, Get, Post, Body, Param, Query,
    UseGuards, Request, HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RidesService } from './rides.service';

@Controller('rides')
export class RidesController {
    constructor(private readonly ridesService: RidesService) { }

    @Post('quote')
    @UseGuards(AuthGuard('jwt'))
    async createQuote(@Request() req: any, @Body() body: any) {
        return this.ridesService.createQuote(body.customerId, body);
    }

    @Post('request')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(201)
    async requestRide(@Request() req: any, @Body() body: any) {
        return this.ridesService.requestRide(body.customerId, body);
    }

    @Post(':id/dispatch')
    @UseGuards(AuthGuard('jwt'))
    async dispatchRide(@Param('id') id: string) {
        return this.ridesService.dispatchRide(id);
    }

    @Post(':id/accept')
    @UseGuards(AuthGuard('jwt'))
    async acceptOffer(
        @Param('id') offerId: string,
        @Body() body: { driverId: string },
    ) {
        return this.ridesService.acceptOffer(body.driverId, offerId);
    }

    @Post(':id/arrive')
    @UseGuards(AuthGuard('jwt'))
    async arriveAtPickup(
        @Param('id') id: string,
        @Body() body: { driverId: string },
    ) {
        return this.ridesService.arriveAtPickup(id, body.driverId);
    }

    @Post(':id/start')
    @UseGuards(AuthGuard('jwt'))
    async startRide(
        @Param('id') id: string,
        @Body() body: { driverId: string; pinCode: string },
    ) {
        return this.ridesService.startRide(id, body.driverId, body.pinCode);
    }

    @Post(':id/complete')
    @UseGuards(AuthGuard('jwt'))
    async completeRide(
        @Param('id') id: string,
        @Body() body: { driverId: string },
    ) {
        return this.ridesService.completeRide(id, body.driverId);
    }

    @Post(':id/cancel')
    @UseGuards(AuthGuard('jwt'))
    async cancelRide(
        @Param('id') id: string,
        @Body() body: { userId: string; reason: string },
    ) {
        return this.ridesService.cancelRide(id, body.userId, body.reason);
    }

    @Get(':id')
    @UseGuards(AuthGuard('jwt'))
    async getRide(@Param('id') id: string) {
        return this.ridesService.getRideById(id);
    }

    @Get('active/customer/:customerId')
    @UseGuards(AuthGuard('jwt'))
    async getActiveRide(@Param('customerId') customerId: string) {
        return this.ridesService.getActiveRideForCustomer(customerId);
    }

    @Get('history/list')
    @UseGuards(AuthGuard('jwt'))
    async getHistory(
        @Request() req: any,
        @Query('page') page = 1,
        @Query('limit') limit = 20,
    ) {
        return this.ridesService.getRideHistory(req.user.userId, req.user.role, +page, +limit);
    }
}
