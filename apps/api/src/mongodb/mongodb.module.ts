import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PropertySpec, PropertySpecSchema } from './schemas/property-spec.schema';
import { PropertySpecService } from './property-spec.service';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/elite_realty'),
    MongooseModule.forFeature([{ name: PropertySpec.name, schema: PropertySpecSchema }]),
  ],
  providers: [PropertySpecService],
  exports: [PropertySpecService, MongooseModule],
})
export class MongodbModule {}
