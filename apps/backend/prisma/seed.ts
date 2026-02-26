import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Organization data...');

    const organizations = [
        {
            name: 'Acme Corporation',
            slug: 'acme-corporation',
            githubInstallationId: 'seed-installation-1001',
        },
        {
            name: 'TechNova Labs',
            slug: 'technova-labs',
            githubInstallationId: 'seed-installation-1002',
        },
        {
            name: 'Skybridge Ventures',
            slug: 'skybridge-ventures',
            githubInstallationId: 'seed-installation-1003',
        },
        {
            name: 'Quantum Systems',
            slug: 'quantum-systems',
            githubInstallationId: 'seed-installation-1004',
        },
        {
            name: 'Nexus Innovations',
            slug: 'nexus-innovations',
            githubInstallationId: 'seed-installation-1005',
        },
    ];

    for (const org of organizations) {
        const result = await prisma.organization.upsert({
            where: { slug: org.slug },
            update: {},
            create: {
                ...org,
                githubInstallationId: Math.floor(Math.random() * 1000000000).toString(),
            },
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
