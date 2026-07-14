import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CommunityService } from './community.service';
import {
  CreateAmenityDto,
  UpdateAmenityDto,
  AmenityQueryDto,
  CreateBookingDto,
  UpdateBookingDto,
  BookingQueryDto,
  CreatePostDto,
  UpdatePostDto,
  PostQueryDto,
} from './dto/community.dto';

@ApiTags('Community')
@Controller('amenities')
export class AmenityController {
  constructor(private readonly service: CommunityService) {}

  @Post() @ApiOperation({ summary: 'Create an amenity' })
  create(@Body() dto: CreateAmenityDto) { return this.service.createAmenity(dto); }

  @Get() @ApiOperation({ summary: 'List amenities with filters and pagination' })
  findAll(@Query() query: AmenityQueryDto) { return this.service.findAllAmenities(query); }

  @Get(':id') @ApiOperation({ summary: 'Get an amenity by ID (includes bookings + property)' })
  findOne(@Param('id') id: string) { return this.service.findOneAmenity(id); }

  @Patch(':id') @ApiOperation({ summary: 'Update an amenity' })
  update(@Param('id') id: string, @Body() dto: UpdateAmenityDto) {
    return this.service.updateAmenity(id, dto);
  }

  @Delete(':id') @ApiOperation({ summary: 'Delete an amenity' })
  remove(@Param('id') id: string) { return this.service.removeAmenity(id); }
}

@ApiTags('Community')
@Controller('amenity-bookings')
export class AmenityBookingController {
  constructor(private readonly service: CommunityService) {}

  @Post() @ApiOperation({ summary: 'Create an amenity booking' })
  create(@Body() dto: CreateBookingDto) { return this.service.createBooking(dto); }

  @Get() @ApiOperation({ summary: 'List amenity bookings with filters' })
  findAll(@Query() query: BookingQueryDto) { return this.service.findAllBookings(query); }

  @Get('tenant/:tenantId') @ApiOperation({ summary: 'List amenity bookings for a tenant' })
  getByTenant(@Param('tenantId') tenantId: string) { return this.service.getBookingsByTenant(tenantId); }

  @Get(':id') @ApiOperation({ summary: 'Get an amenity booking by ID' })
  findOne(@Param('id') id: string) { return this.service.findOneBooking(id); }

  @Patch(':id') @ApiOperation({ summary: 'Update an amenity booking' })
  update(@Param('id') id: string, @Body() dto: UpdateBookingDto) {
    return this.service.updateBooking(id, dto);
  }

  @Delete(':id') @ApiOperation({ summary: 'Delete an amenity booking' })
  remove(@Param('id') id: string) { return this.service.removeBooking(id); }
}

@ApiTags('Community')
@Controller('community-posts')
export class CommunityPostController {
  constructor(private readonly service: CommunityService) {}

  @Post() @ApiOperation({ summary: 'Create a community post' })
  create(@Body() dto: CreatePostDto) { return this.service.createPost(dto); }

  @Get() @ApiOperation({ summary: 'List community posts with filters' })
  findAll(@Query() query: PostQueryDto) { return this.service.findAllPosts(query); }

  @Get(':id') @ApiOperation({ summary: 'Get a community post by ID' })
  findOne(@Param('id') id: string) { return this.service.findOnePost(id); }

  @Patch(':id') @ApiOperation({ summary: 'Update a community post' })
  update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.service.updatePost(id, dto);
  }

  @Delete(':id') @ApiOperation({ summary: 'Delete a community post' })
  remove(@Param('id') id: string) { return this.service.removePost(id); }
}
