import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PropertySpecDocument = HydratedDocument<PropertySpec>;

@Schema({ collection: 'property_specs', timestamps: true })
export class PropertySpec {
  @Prop({ required: true, unique: true, index: true })
  propertyId: string;

  @Prop({ type: Object, default: {} })
  specs: Record<string, unknown>;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, unknown>;
}

export const PropertySpecSchema = SchemaFactory.createForClass(PropertySpec);
