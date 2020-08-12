import request from 'supertest';
import app from '../src/app';

const user = {
  email: 'pierre@loud.gg',
  username: 'pierre',
  password: '12345678',
};

test('user cannot register given wrong body', async () => {
  const response = await request(app)
    .post('/register')
    .send({
      ...user,
      password: '123',
    })
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(500);

  expect(response.body.validationError).toBeTruthy();
});

test('user can register', async () => {
  const response = await request(app)
    .post('/register')
    .send(user)
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(200);

  expect(response.body.id).toBeDefined();
});

test('user can login given right credentials', async () => {
  const response = await request(app)
    .post('/login')
    .send({ username: user.username, password: user.password })
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(200);

  expect(response.body.token).toBeDefined();
});

test('user cannot login given wrong credentials', async () => {
  const response = await request(app)
    .post('/login')
    .send({ username: user.username, password: 'wrongpassword' })
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(401);

  expect(response.body.token).not.toBeDefined();
});
