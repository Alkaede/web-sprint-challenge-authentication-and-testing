const request = require('supertest')
const server = require('./server')
const db = require('../data/dbConfig');
const user = {username: 'testUser', password: 'password'}

// Write your tests here
test('sanity', () => {
  expect(true).toBe(true)
})

describe('server.js', () => {
  // migration stuff for our db to run once
  beforeAll(async () => {
    await db.migrate.rollback();
    await db.migrate.latest();
  });

  // we want to truncate the entire database everytime to have a fresh table
  beforeEach(async () => {
    await db('users').truncate();
  });

  // handles deleting the db to avoid leaks
  afterAll(async () => {
    await db.destroy();
  });

  describe('[POST] /register', () => {
    it('will register a user', async () => {
      let res;
      res = await request(server).post('/api/auth/register')
        .send(user)

      expect(res.status).toEqual(201)
    });

    it('will return error on exact username existing', async () => {
      let res;
      res = await request(server).post('/api/auth/register')
        .send(user)
        .expect(201)

        // creating a new user with same username
      let newUser;
      newUser = await request(server).post('/api/auth/register')
        .send({username: 'testUser', password: 'somethingelse'})
        .expect(500)

      // console.log(newUser)
      expect(res.status).toEqual(201)
      expect(newUser.status).toEqual(500)
    });
  });

  describe('[POST] /login', () => {
    it('will create a user login in with proper credentials', async () => {
      // creating the user
      let res;
      res = await request(server).post('/api/auth/register')
        .send(user)

      // logging in with the user
      res = await request(server).post('/api/auth/login')
          .send(user)
    
    // console.log(res.json)
      expect(res.status).toEqual(200) 
    });

    it('will fail when there are no proper credentials', async () => {
      let res;
      res = await request(server).post('/api/auth/register')
        .send(user)

      // logging in without a password
      res = await request(server).post('/api/auth/login')
        .send({username: 'testUser', password: ''})

      expect(res.status).toEqual(400)
    })
  });

});