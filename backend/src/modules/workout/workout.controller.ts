import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { WorkoutService } from './workout.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('workout')
export class WorkoutController {
  constructor(private readonly workoutService: WorkoutService) {}

  @Get('exercises')
  findAllWorkouts(@Query() query: any) {
    return this.workoutService.findAllWorkouts(query);
  }
  @Post('exercises')
  createWorkout(@Body() dto: any) {
    return this.workoutService.createWorkout(dto);
  }
  @Patch('exercises/:id')
  updateWorkout(@Param('id') id: string, @Body() dto: any) {
    return this.workoutService.updateWorkout(+id, dto);
  }
  @Delete('exercises/:id')
  removeWorkout(@Param('id') id: string) {
    return this.workoutService.removeWorkout(+id);
  }

  @Get('diet-plans')
  findAllDietPlans(@Query() query: any) {
    return this.workoutService.findAllDietPlans(query);
  }
  @Post('diet-plans')
  createDietPlan(@Body() dto: any) {
    return this.workoutService.createDietPlan(dto);
  }
  @Patch('diet-plans/:id')
  updateDietPlan(@Param('id') id: string, @Body() dto: any) {
    return this.workoutService.updateDietPlan(+id, dto);
  }
  @Delete('diet-plans/:id')
  removeDietPlan(@Param('id') id: string) {
    return this.workoutService.removeDietPlan(+id);
  }
}
