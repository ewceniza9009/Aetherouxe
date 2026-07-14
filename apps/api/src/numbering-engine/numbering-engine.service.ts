import { Injectable } from '@nestjs/common';

interface GenerateCodeParams {
  projectCode: string;
  buildingCode: string;
  unitNumber: string;
  template?: string;
}

@Injectable()
export class NumberingEngineService {
  generatePropertyCode(params: GenerateCodeParams): string {
    const template = params.template ?? '{PROJECT_CODE}-{BUILDING_CODE}-{UNIT_NUMBER}';
    const paddedUnit = params.unitNumber.padStart(3, '0');
    return template
      .replace(/{PROJECT_CODE}/g, params.projectCode)
      .replace(/{BUILDING_CODE}/g, params.buildingCode)
      .replace(/{UNIT_NUMBER}/g, paddedUnit);
  }

  parsePropertyCode(code: string): { projectCode?: string; buildingCode?: string; unitNumber?: string } {
    const parts = code.split('-');
    if (parts.length >= 3) {
      return { projectCode: parts[0], buildingCode: parts[1], unitNumber: parts.slice(2).join('-') };
    }
    return { unitNumber: code };
  }
}
