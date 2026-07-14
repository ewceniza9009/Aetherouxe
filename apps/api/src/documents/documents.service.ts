import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  DocumentQueryDto,
  CreateSignatureDto,
  UpdateSignatureDto,
} from './dto/documents.dto';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  // ─── Document Vault ────────────────────────
  async createDocument(dto: CreateDocumentDto) {
    return this.prisma.documentVault.create({
      data: {
        ownerType: dto.ownerType,
        ownerId: dto.ownerId,
        documentType: dto.documentType,
        title: dto.title,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        mimeType: dto.mimeType,
        fileSize: dto.fileSize,
        uploadedById: dto.uploadedById,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        isSigned: false,
      },
    });
  }

  async findAllDocuments(query: DocumentQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.ownerType) where.ownerType = query.ownerType;
    if (query.ownerId) where.ownerId = query.ownerId;
    if (query.documentType) where.documentType = query.documentType;
    if (query.isSigned !== undefined) where.isSigned = query.isSigned;

    const [data, total] = await Promise.all([
      this.prisma.documentVault.findMany({ where, skip, take: limit, orderBy: { uploadedAt: 'desc' } }),
      this.prisma.documentVault.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOneDocument(id: string) {
    const doc = await this.prisma.documentVault.findUnique({
      where: { id },
      include: { signatures: true },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async updateDocument(id: string, dto: UpdateDocumentDto) {
    await this.findOneDocument(id);
    return this.prisma.documentVault.update({
      where: { id },
      data: {
        isSigned: dto.isSigned,
        title: dto.title,
        documentType: dto.documentType,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        mimeType: dto.mimeType,
        fileSize: dto.fileSize,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      },
    });
  }

  async removeDocument(id: string) {
    await this.findOneDocument(id);
    await this.prisma.documentVault.delete({ where: { id } });
    return { deleted: true };
  }

  async getDocumentsByOwner(ownerType: string, ownerId: string) {
    return this.prisma.documentVault.findMany({
      where: { ownerType: ownerType as any, ownerId },
      orderBy: { uploadedAt: 'desc' },
      include: { signatures: true },
    });
  }

  // ─── Document Signatures ───────────────────
  async createSignature(dto: CreateSignatureDto) {
    const doc = await this.prisma.documentVault.findUnique({ where: { id: dto.documentVaultId } });
    if (!doc) throw new NotFoundException('Document not found');

    return this.prisma.documentSignature.create({
      data: {
        documentVaultId: dto.documentVaultId,
        signerName: dto.signerName,
        signerEmail: dto.signerEmail,
        signerUserId: dto.signerUserId,
        signatureUrl: dto.signatureUrl,
        status: 'pending',
      },
    });
  }

  async findAllSignatures(documentVaultId: string) {
    return this.prisma.documentSignature.findMany({
      where: { documentVaultId },
      orderBy: { requestedAt: 'desc' },
    });
  }

  async findOneSignature(sigId: string) {
    const sig = await this.prisma.documentSignature.findUnique({ where: { id: sigId } });
    if (!sig) throw new NotFoundException('Signature not found');
    return sig;
  }

  async updateSignature(sigId: string, dto: UpdateSignatureDto) {
    const sig = await this.findOneSignature(sigId);

    const data: any = { status: dto.status, signatureUrl: dto.signatureUrl };
    if (dto.status === 'signed') {
      data.signedAt = new Date();
    }

    const updated = await this.prisma.documentSignature.update({ where: { id: sigId }, data });

    if (dto.status === 'signed') {
      await this.prisma.documentVault.update({
        where: { id: sig.documentVaultId },
        data: { isSigned: true },
      });
    }

    return updated;
  }

  async markSignatureSigned(sigId: string) {
    return this.updateSignature(sigId, { status: 'signed' });
  }

  async removeSignature(sigId: string) {
    await this.findOneSignature(sigId);
    await this.prisma.documentSignature.delete({ where: { id: sigId } });
    return { deleted: true };
  }
}
