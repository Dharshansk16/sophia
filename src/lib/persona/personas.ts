import { prisma } from "@/lib/prisma";

// --- Personas ---
export async function listPersonas() {
  return prisma.persona.findMany({
    where: { deletedAt: null },
    include: { personaTags: { include: { tag: true } } },
  });
}

export async function getPersona(id: string) {
  return prisma.persona.findUnique({
    where: { id },
    include: { personaTags: { include: { tag: true } } },
  });
}

export async function createPersona(data: {
  name: string;
  slug: string;
  shortBio?: string;
  imageUrl?: string;
}) {
  return prisma.persona.create({ data });
}

export async function updatePersona(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    shortBio: string;
    imageUrl: string;
  }>
) {
  return prisma.persona.update({ where: { id }, data });
}

export async function deletePersona(id: string) {
  return prisma.persona.delete({
    where: { id },
  });
}

// --- Tags ---
export async function listTags() {
  return prisma.tag.findMany();
}

export async function createTag(name: string) {
  return prisma.tag.create({ data: { name } });
}

// --- Persona <-> Tag ---
export async function assignTag(personaId: string, tagId: string) {
  return prisma.personaTag.create({
    data: { personaId, tagId },
  });
}

export async function removeTag(personaId: string, tagId: string) {
  return prisma.personaTag.delete({
    where: { personaId_tagId: { personaId, tagId } },
  });
}
