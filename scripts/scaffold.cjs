#!/usr/bin/env node
/**
 * Elite Realty — CRUD scaffold generator
 *
 * Generates a complete, convention-matching feature slice from a simple
 * field list:
 *   - API:  module, service, controller, dto (create/update)
 *   - API:  prisma model stub (appended to schema.prisma)
 *   - Web:  react-query hook
 *   - Web:  list + create/edit page
 *
 * This mirrors the existing patterns (floors, amenities, agents) so the
 * generated code drops in and typechecks without rework.
 *
 * USAGE
 *   node scripts/scaffold.cjs <EntityName> --fields "name:string,age:number,..."
 *
 * Field types: string | number | boolean | date | enum | uuid
 * Append "?"" for optional (e.g. "nickname?:string").
 * For enum, write "status:enum:active,pending,archived".
 *
 * Example:
 *   node scripts/scaffold.cjs AmenityCategory \
 *     --fields "name:string,description?:string,status:enum:active,inactive"
 */

const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error("Usage: node scripts/scaffold.cjs <EntityName> --fields \"name:string,...\"");
  process.exit(1);
}

const entityName = args[0];
let fieldsArg = args.find((a) => a.startsWith("--fields="))?.replace("--fields=", "");
if (!fieldsArg) {
  const idx = args.findIndex((a) => a === "--fields");
  if (idx !== -1 && args[idx + 1]) fieldsArg = args[idx + 1];
}
if (!fieldsArg) {
  console.error("Missing --fields flag");
  process.exit(1);
}

const REPO_ROOT = path.resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const pascal = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const camel = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const kebab = (s) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();

const entity = pascal(entityName);
const entityLower = camel(entityName);
const routeBase = kebab(entityName);
const table = routeBase.replace(/-/g, "_");

function parseFields(raw) {
  return raw.split(",").map((part) => {
    const [spec, ...rest] = part.split(":");
    const optional = spec.endsWith("?");
    const name = optional ? spec.slice(0, -1) : spec;
    let type = rest[0] || "string";
    const enumValues = type === "enum" ? (rest[1] || "").split("|") : [];
    return { name: camel(name), type, optional, enumValues };
  });
}

const fields = parseFields(fieldsArg);

// Typescript type per field
function tsType(f) {
  switch (f.type) {
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "date":
      return "string"; // ISO
    case "uuid":
      return "string";
    case "enum":
      return f.enumValues.length ? f.enumValues.map((v) => `"${v}"`).join(" | ") : "string";
    default:
      return "string";
  }
}

function prismaType(f) {
  switch (f.type) {
    case "number":
      return "Int";
    case "boolean":
      return "Boolean";
    case "date":
      return "DateTime";
    case "uuid":
      return "String";
    case "enum":
      return "String";
    default:
      return "String";
  }
}

function validator(f) {
  if (f.optional) {
    let base = "@IsOptional()";
    if (f.type === "number") base += " @Type(() => Number)";
    return `@ApiPropertyOptional() ${base} @${validatorName(f.type)}()`;
  }
  let base = "";
  if (f.type === "number") base = "@Type(() => Number) ";
  return `@ApiProperty() ${base}@${validatorName(f.type)}()`;
}

function validatorName(t) {
  switch (t) {
    case "number":
      return "IsNumber";
    case "boolean":
      return "IsBoolean";
    case "date":
      return "IsISO8601";
    case "uuid":
      return "IsUUID";
    case "enum":
      return "IsString";
    default:
      return "IsString";
  }
}

const editable = fields.filter((f) => !["id", "createdAt", "updatedAt"].includes(f.name));

// ---------------------------------------------------------------------------
// 1. DTO
// ---------------------------------------------------------------------------
function buildDto() {
  const imports = new Set([
    "IsString",
    "IsOptional",
  ]);
  if (fields.some((f) => f.type === "number")) imports.add("IsNumber");
  if (fields.some((f) => f.type === "boolean")) imports.add("IsBoolean");
  if (fields.some((f) => f.type === "date")) imports.add("IsISO8601");
  if (fields.some((f) => f.type === "uuid")) imports.add("IsUUID");
  const needsType = fields.some((f) => f.type === "number" || f.type === "date");

  let header = `import { ${[...imports].join(", ")} } from 'class-validator';\n`;
  if (needsType) header += `import { Type } from 'class-transformer';\n`;
  header += `import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';\n`;

  const enumConsts = fields
    .filter((f) => f.type === "enum" && f.enumValues.length)
    .map((f) => {
      const constName = `${pascal(f.name)}Values`;
      return `export const ${constName} = [${f.enumValues.map((v) => `'${v}'`).join(", ")}] as const;\nexport type ${pascal(f.name)}Type = (typeof ${constName})[number];`;
    })
    .join("\n\n");

  const createFields = editable
    .map((f) => `  ${validator(f)} ${f.name}${f.optional ? "?" : ""}: ${tsType(f)};`)
    .join("\n");
  const updateFields = editable
    .map((f) => `  ${validator(f)} ${f.name}?: ${tsType(f)};`)
    .join("\n");

  return `${header}\n${enumConsts ? enumConsts + "\n\n" : ""}export class Create${entity}Dto {\n${createFields}\n}\n\nexport class Update${entity}Dto {\n${updateFields}\n}\n`;
}

// ---------------------------------------------------------------------------
// 2. Service
// ---------------------------------------------------------------------------
function buildService() {
  return `import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Create${entity}Dto, Update${entity}Dto } from './dto/${routeBase}.dto';
import { paginate, ListQueryDto } from '../common/dto/list-query.dto';

@Injectable()
export class ${entity}Service {
  constructor(private prisma: PrismaService) {}

  async create(dto: Create${entity}Dto, tenantId: string) {
    return this.prisma.${entityLower}.create({ data: { ...dto, tenantId } as any });
  }

  async findAll(tenantId: string, query: ListQueryDto) {
    return paginate(this.prisma.${entityLower}, {
      ...query,
      where: { tenantId },
      defaultSort: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const item = await this.prisma.${entityLower}.findUnique({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('${entity} not found');
    return item;
  }

  async update(id: string, dto: Update${entity}Dto, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.${entityLower}.update({ where: { id, tenantId }, data: dto as any });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    await this.prisma.${entityLower}.delete({ where: { id, tenantId } });
    return { deleted: true };
  }
}
`;
}

// ---------------------------------------------------------------------------
// 3. Controller
// ---------------------------------------------------------------------------
function buildController() {
  return `import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ${entity}Service } from './${routeBase}.service';
import { Create${entity}Dto, Update${entity}Dto } from './dto/${routeBase}.dto';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserType } from '@prisma/client';

@ApiTags('${entity}')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('${routeBase}')
export class ${entity}Controller {
  constructor(private readonly service: ${entity}Service) {}

  @Get() @ApiOperation({ summary: 'List ${routeBase}' })
  findAll(@Request() req: ExpressRequest & { user: { tenantId: string } }, @Query() query: ListQueryDto) {
    return this.service.findAll(req.user.tenantId, query);
  }

  @Get(':id') @ApiOperation({ summary: 'Get ${entityLower} by ID' })
  findOne(@Request() req: ExpressRequest & { user: { tenantId: string } }, @Param('id') id: string) {
    return this.service.findOne(id, req.user.tenantId);
  }

  @Post() @Roles(UserType.super_admin, UserType.admin, UserType.property_manager) @ApiOperation({ summary: 'Create ${entityLower}' })
  create(@Request() req: ExpressRequest & { user: { tenantId: string } }, @Body() dto: Create${entity}Dto) {
    return this.service.create(dto, req.user.tenantId);
  }

  @Patch(':id') @Roles(UserType.super_admin, UserType.admin, UserType.property_manager) @ApiOperation({ summary: 'Update ${entityLower}' })
  update(@Request() req: ExpressRequest & { user: { tenantId: string } }, @Param('id') id: string, @Body() dto: Update${entity}Dto) {
    return this.service.update(id, dto, req.user.tenantId);
  }

  @Delete(':id') @Roles(UserType.super_admin, UserType.admin, UserType.property_manager) @ApiOperation({ summary: 'Delete ${entityLower}' })
  remove(@Request() req: ExpressRequest & { user: { tenantId: string } }, @Param('id') id: string) {
    return this.service.remove(id, req.user.tenantId);
  }
}
`;
}

// ---------------------------------------------------------------------------
// 4. Module
// ---------------------------------------------------------------------------
function buildModule() {
  return `import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ${entity}Controller } from './${routeBase}.controller';
import { ${entity}Service } from './${routeBase}.service';

@Module({
  imports: [PrismaModule],
  controllers: [${entity}Controller],
  providers: [${entity}Service],
  exports: [${entity}Service],
})
export class ${entity}Module {}
`;
}

// ---------------------------------------------------------------------------
// 5. Prisma model stub
// ---------------------------------------------------------------------------
function buildPrismaModel() {
  const lines = fields.map((f) => {
    const req = f.optional ? "?" : "";
    return `  ${f.name.padEnd(14)} ${prismaType(f)}${req}`;
  });
  return `
model ${entity} {
  id        String   @id @default(uuid())
  tenantId  String
${lines.join("\n")}
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Enforces referential integrity (no orphaned rows on tenant delete)
  tenant    Tenant   @relation(fields: [tenantId], references: [id])

  // Fast multi-tenant lookups (every query filters by tenantId)
  @@index([tenantId])
  @@map("${table}")
}
`;
}

// ---------------------------------------------------------------------------
// 6. Web hook
// ---------------------------------------------------------------------------
function buildHook() {
  const interfaceFields = fields
    .map((f) => `  ${f.name}${f.optional ? "?" : ""}: ${tsType(f)};`)
    .join("\n");
  return `import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse } from "@elite-realty/shared-types";

export interface ${entity} {
  id: string;
  tenantId: string;
${interfaceFields}
  createdAt: string;
  updatedAt: string;
}

export interface ${entity}Query {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export function use${entity}s(query: ${entity}Query = {}) {
  return useQuery({
    queryKey: ["${routeBase}", query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.page) params.set("page", String(query.page));
      if (query.limit) params.set("limit", String(query.limit));
      if (query.search) params.set("search", query.search);
      if (query.sortBy) params.set("sortBy", query.sortBy);
      if (query.sortDir) params.set("sortDir", query.sortDir);
      const qs = params.toString();
      const url = qs ? \`/${routeBase}?\${qs}\` : \`/${routeBase}\`;
      const resp = await api.get(url);
      const body = resp.data as ApiResponse<${entity}[]>;
      return {
        data: (body.data ?? []) as ${entity}[],
        meta: body.meta,
      };
    },
  });
}

export function use${entity}(id: string) {
  return useQuery({
    queryKey: ["${routeBase}", id],
    queryFn: async () => {
      const resp = await api.get(\`/${routeBase}/\${id}\`);
      const body = resp.data as ApiResponse<${entity}>;
      return body.data as ${entity};
    },
    enabled: !!id,
  });
}

export function useCreate${entity}() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<${entity}>) => {
      const resp = await api.post(\`/${routeBase}\`, payload);
      return (resp.data as ApiResponse<${entity}>).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["${routeBase}"] });
    },
  });
}

export function useUpdate${entity}() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<${entity}> & { id: string }) => {
      const resp = await api.patch(\`/${routeBase}/\${id}\`, payload);
      return (resp.data as ApiResponse<${entity}>).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["${routeBase}"] });
    },
  });
}

export function useDelete${entity}() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      await api.delete(\`/${routeBase}/\${id}\`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["${routeBase}"] });
    },
  });
}
`;
}

// ---------------------------------------------------------------------------
// 7. Web page
// ---------------------------------------------------------------------------
function buildPage() {
  const firstStringField = editable.find((f) => f.type === "string") || editable[0];
  const titleField = firstStringField ? firstStringField.name : "id";

  const formFields = editable
    .map((f) => {
      if (f.type === "boolean") {
        return `            <div className="space-y-2">
              <Label htmlFor="${f.name}">${pascal(f.name)}</Label>
              <Select
                value={form.${f.name} ? "true" : "false"}
                onValueChange={(v) => setForm((s) => ({ ...s, ${f.name}: v === "true" }))}
              >
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>`;
      }
      if (f.type === "enum") {
        const constName = `${pascal(f.name)}Values`;
        return `            <div className="space-y-2">
              <Label htmlFor="${f.name}">${pascal(f.name)}</Label>
              <Select
                value={form.${f.name}}
                onValueChange={(v) => setForm((s) => ({ ...s, ${f.name}: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {${constName}.map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>`;
      }
      const dateType = f.type === "date" ? ' type="date"' : "";
      const moneyHint = /(price|amount|rate|cost|fee|total|value|balance|paid|owed)/i.test(f.name);
      const inputAttrs = (() => {
        if (f.type === "date") return ' type="date"';
        if (f.type === "number") {
          // Money fields get the currency symbol (data-amount); plain
          // numbers are integer quantities with NO currency symbol — this
          // matches the Input primitive's routing and avoids the old ₱-on-
          // quantity regression.
          return moneyHint
            ? ' type="number" data-amount'
            : ' type="number" step="1"';
        }
        return "";
      })();
      return `            <div className="space-y-2">
              <Label htmlFor="${f.name}">${pascal(f.name)}${f.optional ? "" : " *"}</Label>
              <Input
                id="${f.name}"
                ${inputAttrs}
                value={form.${f.name}}
                onChange={(e) => setForm((s) => ({ ...s, ${f.name}: e.target.value }))}
                placeholder="${pascal(f.name)}"
              />
            </div>`;
    })
    .join("\n");

  const tableCells = editable
    .map(
      (f) =>
        `                        <td className="px-4 py-3">{item.${f.name} ?? "-"}</td>`
    )
    .join("\n");

  const tableHeaders = editable
    .map(
      (f) =>
        `                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">${pascal(
          f.name
        )}</th>`
    )
    .join("\n");

  const initialForm = editable
    .map((f) => {
      if (f.type === "number") return `        ${f.name}: "",`;
      if (f.type === "boolean") return `        ${f.name}: false,`;
      if (f.type === "enum") return `        ${f.name}: ${pascal(f.name)}Values[0],`;
      return `        ${f.name}: "",`;
    })
    .join("\n");

  const enumConsts = editable
    .filter((f) => f.type === "enum" && f.enumValues.length)
    .map(
      (f) =>
        `const ${pascal(f.name)}Values = [${f.enumValues
          .map((v) => `"${v}"`)
          .join(", ")}] as const;`
    )
    .join("\n");

  const payloadLines = editable
    .map((f) => {
      if (f.type === "number")
        return `        ${f.name}: form.${f.name} ? Number(form.${f.name}) : undefined,`;
      return `        ${f.name}: form.${f.name} || undefined,`;
    })
    .join("\n");

  return `import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import {
  use${entity}s,
  useCreate${entity},
  useDelete${entity},
  type ${entity},
} from "@/hooks/use-${routeBase}";
${enumConsts ? "\n" + enumConsts : ""}

export default function ${entity}ListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = use${entity}s({ page, limit: 10 });
  const create${entity} = useCreate${entity}();
  const delete${entity} = useDelete${entity}();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
${initialForm}
  });

  const items = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  const resetForm = () =>
    setForm({
${initialForm}
    });

  const handleCreate = async () => {
    setSaving(true);
    try {
      await create${entity}.mutateAsync({
${payloadLines}
      });
      setOpen(false);
      resetForm();
      refetch();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this ${entityLower}?")) return;
    await delete${entity}.mutateAsync({ id });
    refetch();
  };

  return (
    <div className="space-y-6 flex flex-col min-h-[calc(100vh-6rem)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">${entity}s</h1>
          <p className="text-muted-foreground">Manage ${routeBase}</p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={create${entity}.isPending}>
          <Plus className="mr-2 h-4 w-4" /> New ${entity}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>${entity}s</CardTitle>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">Failed to load ${routeBase}.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <p className="text-sm text-muted-foreground">No ${routeBase} found.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
${tableHeaders}
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: ${entity}) => (
                    <tr
                      key={item.id}
                      className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate({ to: \`/${routeBase}/\${item.id}\` })}
                    >
${tableCells}
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} · {meta?.total ?? 0} total
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New ${entity}</DialogTitle>
            <DialogDescription>Create a new ${entityLower}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
${formFields}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.${titleField}}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
`;
}

// ---------------------------------------------------------------------------
// Write files
// ---------------------------------------------------------------------------
const apiDir = path.join(REPO_ROOT, "apps/api/src", routeBase);
const dtoDir = path.join(apiDir, "dto");
const hookPath = path.join(REPO_ROOT, "apps/admin-web/src/hooks", `use-${routeBase}.ts`);
const pagePath = path.join(REPO_ROOT, "apps/admin-web/src/pages", `${entity}ListPage.tsx`);
const schemaPath = path.join(REPO_ROOT, "apps/api/prisma/schema.prisma");

function writeFileSafe(p, content) {
  if (fs.existsSync(p)) {
    console.warn(`  ! skip existing: ${path.relative(REPO_ROOT, p)}`);
    return;
  }
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  console.log(`  + ${path.relative(REPO_ROOT, p)}`);
}

console.log(`\nScaffolding "${entity}" (route: /${routeBase}, table: ${table})\n`);

writeFileSafe(path.join(dtoDir, `${routeBase}.dto.ts`), buildDto());
writeFileSafe(path.join(apiDir, `${routeBase}.service.ts`), buildService());
writeFileSafe(path.join(apiDir, `${routeBase}.controller.ts`), buildController());
writeFileSafe(path.join(apiDir, `${routeBase}.module.ts`), buildModule());
writeFileSafe(hookPath, buildHook());
writeFileSafe(pagePath, buildPage());

// Append prisma model (informational — requires manual migrate)
const modelBlock = buildPrismaModel();
if (fs.existsSync(schemaPath)) {
  const existing = fs.readFileSync(schemaPath, "utf8");
  if (!existing.includes(`model ${entity} `)) {
    fs.appendFileSync(schemaPath, modelBlock);
    patchTenantBackRelation(existing);
    console.log(`  ~ appended prisma model + Tenant back-relation to ${path.relative(REPO_ROOT, schemaPath)} (run prisma migrate)`);
  } else {
    console.warn(`  ! prisma model already exists, skipped`);
  }
}

/**
 * Add the inverse relation field on the Tenant model so the generated
 * `tenant Tenant @relation(...)` is valid. Injects
 * `    <entityLower>s <Entity>[]` into the Tenant block right before
 * its `@@map("tenants")`.
 */
function patchTenantBackRelation() {
  if (!fs.existsSync(schemaPath)) return;
  let schema = fs.readFileSync(schemaPath, "utf8");
  const backRel = `    ${entityLower}s             ${entity}[]`;
  if (schema.includes(backRel)) return;
  const tenantMapIdx = schema.indexOf('@@map("tenants")');
  if (tenantMapIdx === -1) {
    console.warn(`  ! could not find Tenant model to add back-relation; add manually: ${backRel}`);
    return;
  }
  // Insert before the @@map line, preserving indentation of the block.
  const insertAt = schema.lastIndexOf("\n", tenantMapIdx) + 1;
  schema = schema.slice(0, insertAt) + backRel + "\n" + schema.slice(insertAt);
  fs.writeFileSync(schemaPath, schema);
}

console.log(`\nNext steps:`);
console.log(`  1. Register ${entity}Module in apps/api/src/app.module.ts`);
console.log(`  2. Import + add route for ${entity}ListPage in apps/admin-web/src/router.tsx`);
console.log(`  3. Add a nav entry in Sidebar.tsx`);
console.log(`  4. Run: npx prisma migrate dev --name add_${table}\n`);
