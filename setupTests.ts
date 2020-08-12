import prisma from './src/prisma';

jest.setTimeout(10000);

afterAll(async (done) => {
  await prisma.$disconnect();
  done();
});
