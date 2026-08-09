import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RedeemRewardDto {
  @ApiProperty({ description: 'The ID of the reward item to redeem' })
  @IsString()
  @IsNotEmpty()
  rewardItemId: string;
}
