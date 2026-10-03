const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');

describe('Lab Management System - API Integration Tests', () => {
  let studentToken;
  let adminToken;
  let facultyToken;
  let labAId;
  let testBookingId;
  let testProjectId;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  // 1. Health check
  test('GET /api/health returns 200 and operational status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // 2. Login as Student
  test('POST /api/auth/login authenticates student with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'student@example.com',
      password: 'Password123!',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.userType).toBe('student');
    studentToken = res.body.data.token;
  });

  // 3. Login as Admin & Faculty
  test('POST /api/auth/login authenticates admin and faculty', async () => {
    const adminRes = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'Password123!',
    });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.token;

    const facRes = await request(app).post('/api/auth/login').send({
      email: 'faculty@example.com',
      password: 'Password123!',
    });
    expect(facRes.status).toBe(200);
    facultyToken = facRes.body.data.token;
  });

  // 4. Registration
  test('POST /api/auth/register registers a new student', async () => {
    const uniqueEmail = `test.student.${Date.now()}@example.com`;
    const res = await request(app).post('/api/auth/register').send({
      userName: 'Test Registered Student',
      email: uniqueEmail,
      password: 'Password123!',
      department: 'Computer Science',
      yearOfStudy: '1st Year',
      skills: ['HTML', 'CSS', 'JavaScript'],
      interests: ['Web Design'],
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(uniqueEmail);
  });

  // 5. Protected Endpoint /api/auth/me
  test('GET /api/auth/me returns current authenticated user profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('student@example.com');
  });

  // 6. Role protection test: Student cannot access /api/admin/users
  test('Role protection: Student is rejected (403) from accessing admin routes', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // 7. Role protection: Admin can access /api/admin/users
  test('Role protection: Admin can access /api/admin/users', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // 8. Fetch Labs and seat availability
  test('GET /api/labs returns lab list with calculated availability', async () => {
    const res = await request(app)
      .get('/api/labs')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    labAId = res.body.data[0]._id;
  });

  // 9. Booking creation
  test('POST /api/bookings creates a valid booking and prevents conflicting booking', async () => {
    // Pick next weekday (Monday) to guarantee standard lab operating hours
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + ((1 + 7 - targetDate.getDay()) % 7 || 7));
    const dateStr = targetDate.toISOString().split('T')[0];

    // Booking A: 10:00 - 11:00 on S-15
    const bookingA = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        labId: labAId,
        seatId: 'S-15',
        bookingDate: dateStr,
        startTime: '10:00',
        endTime: '11:00',
        purpose: 'Test Automated Booking A',
      });

    expect(bookingA.status).toBe(201);
    expect(bookingA.body.success).toBe(true);
    testBookingId = bookingA.body.data._id;

    // Booking B (Overlapping 10:30 - 11:30 on SAME seat S-15) -> MUST BE REJECTED 409
    const bookingB = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        labId: labAId,
        seatId: 'S-15',
        bookingDate: dateStr,
        startTime: '10:30',
        endTime: '11:30',
        purpose: 'Overlapping Conflict Booking B',
      });

    expect(bookingB.status).toBe(409);
    expect(bookingB.body.success).toBe(false);
    expect(bookingB.body.message).toContain('conflict');

    // Booking C (Adjacent 11:00 - 12:00 on SAME seat S-15) -> MUST BE ALLOWED 201
    const bookingC = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        labId: labAId,
        seatId: 'S-15',
        bookingDate: dateStr,
        startTime: '11:00',
        endTime: '12:00',
        purpose: 'Adjacent Non-Overlapping Booking C',
      });

    expect(bookingC.status).toBe(201);
    expect(bookingC.body.success).toBe(true);
  });

  // 10. Booking cancellation
  test('DELETE /api/bookings/:id cancels eligible booking', async () => {
    const res = await request(app)
      .delete(`/api/bookings/${testBookingId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('cancelled');
  });

  // 11. Project Creation & Retrieval
  test('POST /api/projects creates project and GET /api/projects retrieves it', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Automated Test Project',
        description: 'Testing project creation and collaboration workflows.',
        category: 'Web Development',
        technologies: ['React', 'Express'],
        tags: ['Testing'],
        status: 'active',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Automated Test Project');
    testProjectId = res.body.data._id;

    const listRes = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBeGreaterThan(0);
  });

  // 12. Peer Discovery Endpoint
  test('GET /api/users/peers returns peers with explainable matchScore', async () => {
    const res = await request(app)
      .get('/api/users/peers')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) {
      expect(res.body.data[0].matchScore).toBeDefined();
      expect(res.body.data[0].matchExplanation).toBeDefined();
    }
  });

  // 13. Collaboration Request
  test('POST /api/collaborations/request allows peer to request collaboration', async () => {
    // Login as student 2 to request collaboration on student 1's project
    const student2Login = await request(app).post('/api/auth/login').send({
      email: 'student2@example.com',
      password: 'Password123!',
    });
    const s2Token = student2Login.body.data.token;

    const res = await request(app)
      .post('/api/collaborations/request')
      .set('Authorization', `Bearer ${s2Token}`)
      .send({
        projectId: testProjectId,
        proposedRole: 'QA Engineer',
        message: 'I can write end-to-end integration tests for this project.',
        skills: ['Testing', 'Jest'],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('pending');
  });

  // 14. Admin Analytics Aggregation
  test('GET /api/admin/analytics returns real aggregated statistics', async () => {
    const res = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.summary.totalUsers).toBeGreaterThan(0);
    expect(res.body.data.charts.bookingsByStatus).toBeDefined();
    expect(res.body.data.charts.bookingsByLab).toBeDefined();
  });
});
