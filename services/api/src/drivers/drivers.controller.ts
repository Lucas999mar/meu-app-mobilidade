import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DriversService } from './drivers.service';

@Controller('drivers')
export class DriversController {
    constructor(private readonly driversService: DriversService) { }

    @Post(':id/location')
    @UseGuards(AuthGuard('jwt'))
    async updateLocation(
        @Param('id') id: string,
        @Body() body: { lat: number; lng: number; heading?: number; speed?: number; accuracy?: number },
    ) {
        await this.driversService.updateLocation(id, body.lat, body.lng, body.heading, body.speed, body.accuracy);
        return { success: true };
    }

    @Put(':id/availability')
    @UseGuards(AuthGuard('jwt'))
    async setAvailability(
        @Param('id') id: string,
        @Body() body: { availability: string },
    ) {
        return this.driversService.setAvailability(id, body.availability);
    }

    @Get('profile/me')
    @UseGuards(AuthGuard('jwt'))
    async getProfile(@Request() req: any) {
        return this.driversService.getDriverProfile(req.user.userId);
    }

    @Get(':id/offers')
    @UseGuards(AuthGuard('jwt'))
    async getOffers(@Param('id') id: string) {
        return this.driversService.getPendingOffers(id);
    }

    @Get(':id/earnings')
    @UseGuards(AuthGuard('jwt'))
    async getEarnings(
        @Param('id') id: string,
        @Query('period') period: string = 'today',
    ) {
        return this.driversService.getEarnings(id, period);
    }

    @Get()
    @UseGuards(AuthGuard('jwt'))
    async getAllDrivers(@Query('page') page = 1, @Query('limit') limit = 20) {
        return this.driversService.getAllDrivers(+page, +limit);
    }
}
