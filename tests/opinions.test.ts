import request from 'supertest';
import app from '../src/app';

let userId = '';

const user = {
  username: 'pierre',
  password: '12345678',
  email: 'pierre@gmail.com',
};

const registerUser = async () => {
  const responseUser = await request(app)
    .post('/register')
    .send(user)
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(200);

  userId = responseUser.body.id;
};

beforeAll((done) => {
  registerUser();
  done();
});

const getToken = async () => {
  const response = await request(app)
    .post('/login')
    .send({ username: user.username, password: user.password })
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(200);

  return response.body.token;
};

test('anynomous user can see all opinions', async () => {
  const response = await request(app).get('/opinions').expect('Content-Type', /json/).expect(200);

  expect(response.body.opinions).toBeDefined();
});

test('anynomous user cannot create opinions', async () => {
  const opinion = {
    title: '123',
    content: 'Pierre',
  };
  const response = await request(app)
    .post('/opinions')
    .send(opinion)
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(401);

  expect(response.body.error).toBeDefined();
});

test('authenticated user can create opinions', async () => {
  const opinion = {
    title: '123',
    content: 'Pierre',
  };
  const token = await getToken();

  const response = await request(app)
    .post('/opinions')
    .send(opinion)
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${token}`)
    .expect('Content-Type', /json/)
    .expect(201);

  expect(response.body.title).toBe(opinion.title);
  expect(response.body.content).toBe(opinion.content);

  const responseOpinions = await request(app).get('/opinions').expect('Content-Type', /json/).expect(200);

  expect(responseOpinions.body.opinions).toEqual(expect.arrayContaining([expect.objectContaining(opinion)]));
});

test('authenticated user can upvote an opinion', async () => {
  const opinion = {
    title: 'Opinion 123',
    content: 'Pierre content',
  };
  const token = await getToken();

  const response = await request(app)
    .post('/opinions')
    .send(opinion)
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${token}`)
    .expect('Content-Type', /json/)
    .expect(201);

  expect(response.body.id).toBeDefined();

  const opinionId = response.body.id;

  // Vote
  await request(app)
    .post(`/opinions/${opinionId}/vote`)
    .send(opinion)
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${token}`)
    .expect('Content-Type', /json/)
    .expect(201);

  const requestOpinion = await request(app)
    .get(`/opinions/${opinionId}`)
    .set('Authorization', `Bearer ${token}`)
    .expect('Content-Type', /json/)
    .expect(200);

  expect(requestOpinion.body.upvotes).toEqual(expect.arrayContaining([expect.objectContaining({ user_id: userId })]));

  // Remove vote
  await request(app).delete(`/opinions/${opinionId}/vote`).set('Authorization', `Bearer ${token}`).expect(204);

  const requestOpinionAfterDelete = await request(app)
    .get(`/opinions/${opinionId}`)
    .set('Authorization', `Bearer ${token}`)
    .expect('Content-Type', /json/)
    .expect(200);

  // No vote anymore
  expect(requestOpinionAfterDelete.body.upvotes).not.toEqual(
    expect.arrayContaining([expect.objectContaining({ user_id: userId })]),
  );
});
