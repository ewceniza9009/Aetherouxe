import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PropertySpec, PropertySpecDocument } from './schemas/property-spec.schema';

@Injectable()
export class PropertySpecService {
  constructor(@InjectModel(PropertySpec.name) private model: Model<PropertySpecDocument>) {}

  async upsert(propertyId: string, data: { specs?: Record<string, unknown>; metadata?: Record<string, unknown> }): Promise<PropertySpec> {
    return this.model.findOneAndUpdate(
      { propertyId },
      { $set: data },
      { upsert: true, new: true },
    );
  }

  async findByPropertyId(propertyId: string): Promise<PropertySpec | null> {
    return this.model.findOne({ propertyId });
  }

  async deleteByPropertyId(propertyId: string): Promise<void> {
    await this.model.deleteOne({ propertyId });
  }
}
