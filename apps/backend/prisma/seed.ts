import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Organization data...');

    const organizations = [
        {
            name: 'Acme Corporation',
            slug: 'acme-corporation',
        },
        {
            name: 'TechNova Labs',
            slug: 'technova-labs',
        },
        {
            name: 'Skybridge Ventures',
            slug: 'skybridge-ventures',
        },
        {
            name: 'Quantum Systems',
            slug: 'quantum-systems',
        },
        {
            name: 'Nexus Innovations',
            slug: 'nexus-innovations',
        },
    ];

    for (const org of organizations) {
        const result = await prisma.organization.upsert({
            where: { slug: org.slug },
            update: {},
            create: org,
        });
        console.log(`  ✅ Upserted organization: "${result.name}" (${result.id})`);
    }

    console.log('✨ Seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
