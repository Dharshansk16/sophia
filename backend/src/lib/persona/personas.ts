import { prisma } from "@/lib/prisma";

// Admin personas (hardcoded list)
const ADMIN_PERSONA_NAMES = ["Albert Einstein", "Isaac Newton"];

// --- Personas ---
export async function listPersonas() {
  return prisma.persona.findMany({
    where: { deletedAt: null },
    include: { personaTags: { include: { tag: true } } },
  });
}

export async function listUserPersonas(excludeAdmin: boolean = false) {
  const personas = await prisma.persona.findMany({
    where: { deletedAt: null },
    include: { personaTags: { include: { tag: true } } },
  });
  
  if (excludeAdmin) {
    return personas.filter(persona => !ADMIN_PERSONA_NAMES.includes(persona.name));
  }
  
  return personas;
}

export async function listAdminPersonas() {
  return prisma.persona.findMany({
    where: { 
      deletedAt: null,
      name: {
        in: ADMIN_PERSONA_NAMES
      }
    },
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

export async function createUserPersona(data: {
  name: string;
  slug: string;
  shortBio?: string;
  imageUrl?: string;
  userId: string;
}) {
  // Create the persona
  const persona = await prisma.persona.create({ 
    data: {
      name: data.name,
      slug: data.slug,
      shortBio: data.shortBio,
      imageUrl: data.imageUrl,
    }
  });
  
  return persona;
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
