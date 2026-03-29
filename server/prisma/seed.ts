import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const STAR_NAMES = [
  'Sol', 'Proxima', 'Sirius', 'Vega', 'Altair',
  'Rigel', 'Deneb', 'Arcturus', 'Polaris', 'Betelgeuse',
];

const PLANET_PREFIXES = [
  'Terra', 'Nova', 'Kepler', 'Gaia', 'Helios',
  'Titan', 'Ceres', 'Juno', 'Pallas', 'Vesta',
  'Hyperion', 'Eos', 'Rhea', 'Dione', 'Io',
  'Europa', 'Callisto', 'Oberon', 'Ariel', 'Miranda',
];

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

interface BodyInput {
  name: string;
  type: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  resourceRichness: number;
}

async function seed() {
  console.log('Clearing existing data...');
  await prisma.logEntry.deleteMany();
  await prisma.research.deleteMany();
  await prisma.resourceStore.deleteMany();
  await prisma.structure.deleteMany();
  await prisma.celestialBody.deleteMany();
  await prisma.technology.deleteMany();
  await prisma.player.deleteMany();

  console.log('Seeding technologies...');
  await prisma.technology.createMany({
    data: [
      {
        id: 'basic_industry',
        name: 'Basic Industry',
        description: 'Unlocks Refinery structures for alloy production.',
        category: 'industry',
        cost: 50,
        durationSeconds: 1800,
        prerequisiteId: null,
      },
      {
        id: 'advanced_mining',
        name: 'Advanced Mining',
        description: 'Doubles mineral output from all mines.',
        category: 'mining',
        cost: 100,
        durationSeconds: 3600,
        prerequisiteId: 'basic_industry',
      },
      {
        id: 'energy_efficiency',
        name: 'Energy Efficiency',
        description: 'Doubles energy output from all power plants.',
        category: 'energy',
        cost: 100,
        durationSeconds: 3600,
        prerequisiteId: null,
      },
      {
        id: 'alloy_synthesis',
        name: 'Alloy Synthesis',
        description: 'Doubles refinery output and halves mineral consumption.',
        category: 'industry',
        cost: 150,
        durationSeconds: 7200,
        prerequisiteId: 'basic_industry',
      },
    ],
  });

  console.log('Generating galaxy...');
  const bodies: BodyInput[] = [];
  let planetIdx = 0;

  for (let i = 0; i < STAR_NAMES.length; i++) {
    const starX = rand(50, 950);
    const starY = rand(50, 950);
    const starZ = rand(50, 950);

    bodies.push({
      name: STAR_NAMES[i],
      type: 'star',
      x: starX,
      y: starY,
      z: starZ,
      radius: rand(50, 200),
      resourceRichness: rand(1.5, 2.0),
    });

    const numPlanets = randInt(2, 4);
    for (let p = 0; p < numPlanets; p++) {
      const dist = rand(30, 120);
      const angle = rand(0, Math.PI * 2);
      const tilt = rand(-0.3, 0.3);

      const name = PLANET_PREFIXES[planetIdx % PLANET_PREFIXES.length] +
        (planetIdx >= PLANET_PREFIXES.length ? `-${Math.floor(planetIdx / PLANET_PREFIXES.length) + 1}` : '');
      planetIdx++;

      const px = clamp(starX + Math.cos(angle) * dist, 0, 1000);
      const py = clamp(starY + Math.sin(angle) * dist, 0, 1000);
      const pz = clamp(starZ + tilt * dist, 0, 1000);

      bodies.push({
        name,
        type: 'planet',
        x: px,
        y: py,
        z: pz,
        radius: rand(10, 50),
        resourceRichness: rand(0.6, 1.5),
      });

      const numMoons = randInt(0, 2);
      for (let m = 0; m < numMoons; m++) {
        const moonDist = rand(5, 15);
        const moonAngle = rand(0, Math.PI * 2);
        bodies.push({
          name: `${name}-M${m + 1}`,
          type: 'moon',
          x: clamp(px + Math.cos(moonAngle) * moonDist, 0, 1000),
          y: clamp(py + Math.sin(moonAngle) * moonDist, 0, 1000),
          z: clamp(pz + rand(-2, 2), 0, 1000),
          radius: rand(2, 10),
          resourceRichness: rand(0.5, 1.2),
        });
      }
    }

    const numAsteroids = randInt(3, 8);
    for (let a = 0; a < numAsteroids; a++) {
      const dist = rand(80, 200);
      const angle = rand(0, Math.PI * 2);
      const tilt = rand(-0.5, 0.5);
      bodies.push({
        name: `${STAR_NAMES[i]}-AST-${a + 1}`,
        type: 'asteroid',
        x: clamp(starX + Math.cos(angle) * dist, 0, 1000),
        y: clamp(starY + Math.sin(angle) * dist, 0, 1000),
        z: clamp(starZ + tilt * dist, 0, 1000),
        radius: rand(0.5, 2),
        resourceRichness: rand(1.0, 2.0),
      });
    }
  }

  await prisma.celestialBody.createMany({ data: bodies });

  const counts = bodies.reduce((acc, b) => {
    acc[b.type] = (acc[b.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log(`Seeded ${bodies.length} celestial bodies:`, counts);
  console.log('Seeded 4 technologies');
  console.log('Done!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
