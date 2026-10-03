require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');

// Models
const User = require('../models/User');
const Lab = require('../models/Lab');
const Booking = require('../models/Booking');
const Project = require('../models/Project');
const Collaboration = require('../models/Collaboration');
const Notification = require('../models/Notification');

const DEMO_PASSWORD = 'Password123!';

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await connectDB();

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Lab.deleteMany({}),
      Booking.deleteMany({}),
      Project.deleteMany({}),
      Collaboration.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    console.log('[Seed] Seeding Users...');
    // 1. Admin
    const admin = await User.create({
      userId: 'ADM-1001',
      userName: 'Dr. Robert Vance (Admin)',
      email: 'admin@example.com',
      password: DEMO_PASSWORD,
      phoneNumber: '+1-555-0199',
      userType: 'admin',
      department: 'Computer Science & Engineering',
      yearOfStudy: 'N/A',
      profession: 'Head of Lab Operations & Dean',
      avatar: '',
      skills: ['Infrastructure', 'System Administration', 'Network Security', 'Curriculum Planning'],
      interests: ['Cloud Computing', 'Campus Virtualization', 'Smart Labs'],
      isActive: true,
      isEmailVerified: true,
    });

    // 2. Faculty Members
    const faculty1 = await User.create({
      userId: 'FAC-2001',
      userName: 'Prof. Sarah Jenkins',
      email: 'faculty@example.com',
      password: DEMO_PASSWORD,
      phoneNumber: '+1-555-0144',
      userType: 'faculty',
      department: 'Computer Science',
      yearOfStudy: 'N/A',
      profession: 'Associate Professor',
      avatar: '',
      skills: ['Data Structures', 'Full Stack Development', 'MongoDB', 'React', 'Python'],
      interests: ['Distributed Systems', 'Software Engineering', 'Open Source'],
      isActive: true,
      isEmailVerified: true,
    });

    const faculty2 = await User.create({
      userId: 'FAC-2002',
      userName: 'Dr. Michael Chen',
      email: 'faculty2@example.com',
      password: DEMO_PASSWORD,
      phoneNumber: '+1-555-0155',
      userType: 'faculty',
      department: 'Artificial Intelligence & Data Science',
      yearOfStudy: 'N/A',
      profession: 'Assistant Professor',
      avatar: '',
      skills: ['Machine Learning', 'TensorFlow', 'Computer Vision', 'PyTorch', 'Python'],
      interests: ['Neural Networks', 'Autonomous Robotics', 'Deep Learning'],
      isActive: true,
      isEmailVerified: true,
    });

    // 3. Students
    const student1 = await User.create({
      userId: 'STU-3001',
      userName: 'Alex Johnson',
      email: 'student@example.com',
      password: DEMO_PASSWORD,
      phoneNumber: '+1-555-0101',
      userType: 'student',
      department: 'Computer Science',
      yearOfStudy: '3rd Year BCA',
      profession: 'Student & Frontend Developer',
      avatar: '',
      skills: ['React', 'JavaScript', 'HTML5', 'CSS3', 'Node.js', 'UI/UX Design'],
      interests: ['Web Applications', 'Component Design', 'Open Source', 'Microservices'],
      isActive: true,
      isEmailVerified: true,
    });

    const student2 = await User.create({
      userId: 'STU-3002',
      userName: 'Priya Sharma',
      email: 'student2@example.com',
      password: DEMO_PASSWORD,
      phoneNumber: '+1-555-0102',
      userType: 'student',
      department: 'Computer Science',
      yearOfStudy: '3rd Year BCA',
      profession: 'Student & Backend Engineer',
      avatar: '',
      skills: ['Node.js', 'Express', 'MongoDB', 'JavaScript', 'Docker', 'REST APIs'],
      interests: ['Backend Scalability', 'Database Tuning', 'System Design', 'Cloud Deployment'],
      isActive: true,
      isEmailVerified: true,
    });

    const student3 = await User.create({
      userId: 'STU-3003',
      userName: 'David Miller',
      email: 'student3@example.com',
      password: DEMO_PASSWORD,
      phoneNumber: '+1-555-0103',
      userType: 'student',
      department: 'Artificial Intelligence & Data Science',
      yearOfStudy: '2nd Year BCA',
      profession: 'Student & ML Enthusiast',
      avatar: '',
      skills: ['Python', 'Pandas', 'TensorFlow', 'Data Analytics', 'Scikit-Learn'],
      interests: ['Deep Learning', 'Computer Vision', 'Predictive Modeling'],
      isActive: true,
      isEmailVerified: true,
    });

    const student4 = await User.create({
      userId: 'STU-3004',
      userName: 'Emily Davis',
      email: 'student4@example.com',
      password: DEMO_PASSWORD,
      phoneNumber: '+1-555-0104',
      userType: 'student',
      department: 'Information Technology',
      yearOfStudy: '3rd Year BCA',
      profession: 'Student & DevOps Intern',
      avatar: '',
      skills: ['Linux', 'Docker', 'Git', 'CI/CD', 'Bash', 'Networking'],
      interests: ['Kubernetes', 'Cybersecurity', 'Cloud Platforms'],
      isActive: true,
      isEmailVerified: true,
    });

    const student5 = await User.create({
      userId: 'STU-3005',
      userName: 'Carlos Garcia',
      email: 'student5@example.com',
      password: DEMO_PASSWORD,
      phoneNumber: '+1-555-0105',
      userType: 'student',
      department: 'Computer Science',
      yearOfStudy: '2nd Year BCA',
      profession: 'Student & Mobile Developer',
      avatar: '',
      skills: ['React Native', 'JavaScript', 'TypeScript', 'Firebase', 'Mobile UI'],
      interests: ['Cross-platform Apps', 'PWA', 'Game Development'],
      isActive: true,
      isEmailVerified: true,
    });

    const student6 = await User.create({
      userId: 'STU-3006',
      userName: 'Ananya Patel',
      email: 'student6@example.com',
      password: DEMO_PASSWORD,
      phoneNumber: '+1-555-0106',
      userType: 'student',
      department: 'Computer Science',
      yearOfStudy: '3rd Year BCA',
      profession: 'Student & Full Stack Architect',
      avatar: '',
      skills: ['React', 'Node.js', 'MongoDB', 'GraphQL', 'Tailwind', 'Next.js'],
      interests: ['Full Stack Systems', 'Agile Methodologies', 'Peer Mentoring'],
      isActive: true,
      isEmailVerified: true,
    });

    console.log('[Seed] Seeding Laboratories & Graphical Seat Layouts...');
    // Helper to generate grid seats
    const generateGridSeats = (totalSeats, cols, brokenSeatIndices = []) => {
      const seats = [];
      for (let i = 1; i <= totalSeats; i++) {
        const row = Math.floor((i - 1) / cols);
        const col = (i - 1) % cols;
        const isWorking = !brokenSeatIndices.includes(i);
        seats.push({
          seatId: `S-${i}`,
          seatNumber: `PC-${String(i).padStart(2, '0')}`,
          xCoordinate: col,
          yCoordinate: row,
          isWorking,
        });
      }
      return seats;
    };

    // Lab 1: Computer Laboratory A (30 seats: 6 cols x 5 rows. PC-14 and PC-28 broken for demonstration)
    const labASeats = generateGridSeats(30, 6, [14, 28]);
    const labA = await Lab.create({
      labId: 'LAB-101',
      labName: 'Computer Laboratory A',
      department: 'Computer Science',
      capacity: 30,
      location: 'Main Academic Block • Floor 2, Room 204',
      facilities: [
        'Intel Core i7 PCs (32GB RAM)',
        'Gigabit Fiber Internet',
        'Dual UHD Monitors',
        'Centrally Air Conditioned',
        'Digital Ceiling Projector',
        'UPS Power Backup',
      ],
      operatingHours: {
        monday: { start: '08:00', end: '18:00', isOpen: true },
        tuesday: { start: '08:00', end: '18:00', isOpen: true },
        wednesday: { start: '08:00', end: '18:00', isOpen: true },
        thursday: { start: '08:00', end: '18:00', isOpen: true },
        friday: { start: '08:00', end: '18:00', isOpen: true },
        saturday: { start: '09:00', end: '15:00', isOpen: true },
        sunday: { start: '10:00', end: '14:00', isOpen: false },
      },
      layout: {
        width: 6,
        height: 5,
        seats: labASeats,
      },
      isActive: true,
    });

    // Lab 2: Advanced AI & Machine Learning Lab (24 seats: 6 cols x 4 rows)
    const labBSeats = generateGridSeats(24, 6, [7]);
    const labB = await Lab.create({
      labId: 'LAB-102',
      labName: 'Advanced AI & Machine Learning Lab',
      department: 'Artificial Intelligence & Data Science',
      capacity: 24,
      location: 'Innovation Wing • Floor 3, Room 310',
      facilities: [
        'NVIDIA RTX 4090 GPU Workstations',
        'CUDA & Tensor Core Acceleration',
        'High Throughput NAS Storage',
        'Air Conditioned Clean Room',
        'Interactive Smart Board',
      ],
      operatingHours: {
        monday: { start: '08:30', end: '19:00', isOpen: true },
        tuesday: { start: '08:30', end: '19:00', isOpen: true },
        wednesday: { start: '08:30', end: '19:00', isOpen: true },
        thursday: { start: '08:30', end: '19:00', isOpen: true },
        friday: { start: '08:30', end: '19:00', isOpen: true },
        saturday: { start: '09:00', end: '14:00', isOpen: true },
        sunday: { start: '09:00', end: '12:00', isOpen: false },
      },
      layout: {
        width: 6,
        height: 4,
        seats: labBSeats,
      },
      isActive: true,
    });

    // Lab 3: IoT & Embedded Systems Lab (20 seats: 5 cols x 4 rows)
    const labCSeats = generateGridSeats(20, 5, [19]);
    const labC = await Lab.create({
      labId: 'LAB-103',
      labName: 'IoT & Embedded Systems Lab',
      department: 'Information Technology',
      capacity: 20,
      location: 'Technology Center • Ground Floor, Room 102',
      facilities: [
        'Oscilloscopes & Logic Analyzers',
        'Raspberry Pi 5 & ESP32 Workbenches',
        'Soldering & Prototyping Stations',
        'High Precision Multimeters',
      ],
      operatingHours: {
        monday: { start: '09:00', end: '17:00', isOpen: true },
        tuesday: { start: '09:00', end: '17:00', isOpen: true },
        wednesday: { start: '09:00', end: '17:00', isOpen: true },
        thursday: { start: '09:00', end: '17:00', isOpen: true },
        friday: { start: '09:00', end: '17:00', isOpen: true },
        saturday: { start: '09:00', end: '13:00', isOpen: true },
        sunday: { start: '10:00', end: '12:00', isOpen: false },
      },
      layout: {
        width: 5,
        height: 4,
        seats: labCSeats,
      },
      isActive: true,
    });

    console.log('[Seed] Seeding Realistic Bookings for Visual Demonstration...');
    const todayStr = new Date().toISOString().split('T')[0];

    // Tomorrow string
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Booking 1: Confirmed booking today in Lab A (PC-01) - Checked In
    const bkg1 = await Booking.create({
      bookingId: 'BKG-10001',
      userId: student1._id,
      labId: labA._id,
      seatId: 'S-1',
      bookingDate: todayStr,
      timeSlot: { startTime: '10:00', endTime: '12:00', duration: 120 },
      purpose: 'BCA Final Semester Capstone Project Frontend Development',
      status: 'confirmed',
      checkInTime: new Date(Date.now() - 30 * 60 * 1000), // Checked in 30 mins ago
      attendees: ['Alex Johnson'],
      equipment: ['Dual Monitors', 'Headphones'],
    });

    // Booking 2: Confirmed booking today in Lab A (PC-02)
    const bkg2 = await Booking.create({
      bookingId: 'BKG-10002',
      userId: student2._id,
      labId: labA._id,
      seatId: 'S-2',
      bookingDate: todayStr,
      timeSlot: { startTime: '10:00', endTime: '12:00', duration: 120 },
      purpose: 'REST API Performance Testing and MongoDB Indexing',
      status: 'confirmed',
      attendees: ['Priya Sharma'],
      equipment: ['High-speed Network Port'],
    });

    // Booking 3: Pending special booking request in Lab A (PC-03) -> YELLOW reserved
    const bkg3 = await Booking.create({
      bookingId: 'BKG-10003',
      userId: student3._id,
      labId: labA._id,
      seatId: 'S-3',
      bookingDate: todayStr,
      timeSlot: { startTime: '10:00', endTime: '12:00', duration: 120 },
      purpose: 'Deep Learning Model Fine-Tuning - Needs GPU Access & Root Privileges',
      specialRequests: 'Require administrator terminal privileges to run Docker GPU containers.',
      status: 'pending',
    });

    // Booking 4: Confirmed booking today in Lab A (PC-05)
    const bkg4 = await Booking.create({
      bookingId: 'BKG-10004',
      userId: student4._id,
      labId: labA._id,
      seatId: 'S-5',
      bookingDate: todayStr,
      timeSlot: { startTime: '10:00', endTime: '12:00', duration: 120 },
      purpose: 'Container Orchestration Workshop Practice',
      status: 'confirmed',
    });

    // Booking 5: Completed past booking
    const bkg5 = await Booking.create({
      bookingId: 'BKG-10005',
      userId: student1._id,
      labId: labA._id,
      seatId: 'S-6',
      bookingDate: todayStr,
      timeSlot: { startTime: '08:00', endTime: '09:30', duration: 90 },
      purpose: 'Early Morning Algorithm Implementation',
      status: 'completed',
      checkInTime: new Date(Date.now() - 3 * 3600 * 1000),
      checkOutTime: new Date(Date.now() - 90 * 60 * 1000),
    });

    // Booking 6: Upcoming booking tomorrow for student1
    const bkg6 = await Booking.create({
      bookingId: 'BKG-10006',
      userId: student1._id,
      labId: labB._id,
      seatId: 'S-2',
      bookingDate: tomorrowStr,
      timeSlot: { startTime: '11:00', endTime: '13:00', duration: 120 },
      purpose: 'Collaborative AI Lab Session with Dr. Chen',
      status: 'confirmed',
    });

    // Booking 7: Another special request pending faculty review in Lab B
    const bkg7 = await Booking.create({
      bookingId: 'BKG-10007',
      userId: student6._id,
      labId: labB._id,
      seatId: 'S-10',
      bookingDate: tomorrowStr,
      timeSlot: { startTime: '14:00', endTime: '17:00', duration: 180 },
      purpose: 'High Precision Neural Rendering Research',
      specialRequests: 'Dedicated 24GB VRAM allocation for batch processing.',
      status: 'pending',
    });

    console.log('[Seed] Seeding Academic Projects...');
    const project1 = await Project.create({
      projectId: 'PRJ-101',
      ownerId: student1._id,
      title: 'LabPulse - Smart Laboratory Allocation System',
      description:
        'A comprehensive web platform for digitizing college laboratory seat reservations, collision prevention, and student peer collaboration.',
      category: 'Web Development',
      technologies: ['React', 'Node.js', 'Express', 'MongoDB', 'Socket.IO'],
      tags: ['FullStack', 'MERN', 'Laboratory', 'BCA Project'],
      status: 'active',
      timeline: {
        startDate: new Date('2026-08-15'),
        expectedEndDate: new Date('2026-11-30'),
      },
      requirements: {
        skillsNeeded: ['MongoDB', 'Express', 'Docker', 'Testing'],
        rolesNeeded: ['Backend Engineer', 'DevOps Specialist'],
        isLookingForCollaborators: true,
      },
      repository: {
        url: 'https://github.com/alex-johnson/lab-pulse-mgmt',
        platform: 'GitHub',
      },
      visibility: 'public',
      collaborators: [
        { userId: student1._id, role: 'Lead Architect', joinedAt: new Date('2026-08-15') },
        { userId: student6._id, role: 'Full Stack Engineer', joinedAt: new Date('2026-08-20') },
      ],
    });

    const project2 = await Project.create({
      projectId: 'PRJ-102',
      ownerId: student2._id,
      title: 'CampusCloud - Microservices Distributed File Vault',
      description:
        'A highly scalable decentralized storage vault for academic course notes, video lectures, and student submissions with end-to-end encryption.',
      category: 'Cloud Computing',
      technologies: ['Node.js', 'MongoDB', 'Docker', 'Redis', 'AWS S3 API'],
      tags: ['Distributed Systems', 'Cloud', 'Storage'],
      status: 'active',
      timeline: {
        startDate: new Date('2026-07-01'),
        expectedEndDate: new Date('2026-12-15'),
      },
      requirements: {
        skillsNeeded: ['React', 'UI/UX Design', 'Security'],
        rolesNeeded: ['Frontend UI Designer', 'Security Auditor'],
        isLookingForCollaborators: true,
      },
      repository: {
        url: 'https://github.com/priyasharma/campus-cloud-vault',
        platform: 'GitHub',
      },
      visibility: 'public',
      collaborators: [{ userId: student2._id, role: 'System Architect', joinedAt: new Date('2026-07-01') }],
    });

    const project3 = await Project.create({
      projectId: 'PRJ-103',
      ownerId: student3._id,
      title: 'NeuroVision - Autonomous Exam Proctoring System',
      description:
        'Computer vision system powered by OpenCV and PyTorch to monitor classroom behavior and detect prohibited electronic devices during lab exams.',
      category: 'Artificial Intelligence',
      technologies: ['Python', 'OpenCV', 'PyTorch', 'TensorFlow', 'Flask'],
      tags: ['Computer Vision', 'Deep Learning', 'Academic Integrity'],
      status: 'active',
      timeline: {
        startDate: new Date('2026-09-01'),
        expectedEndDate: new Date('2027-01-20'),
      },
      requirements: {
        skillsNeeded: ['React', 'WebRTC', 'FastAPI'],
        rolesNeeded: ['Web Dashboard Engineer', 'Data Annotation Lead'],
        isLookingForCollaborators: true,
      },
      repository: {
        url: 'https://github.com/david-miller/neuro-vision-proctor',
        platform: 'GitHub',
      },
      visibility: 'public',
      collaborators: [{ userId: student3._id, role: 'ML Researcher', joinedAt: new Date('2026-09-01') }],
    });

    const project4 = await Project.create({
      projectId: 'PRJ-104',
      ownerId: student4._id,
      title: 'IoT Campus Environment Sentinel',
      description:
        'Network of ESP32 and Raspberry Pi sensor nodes placed throughout college labs monitoring temperature, air quality, humidity, and acoustics.',
      category: 'IoT & Embedded',
      technologies: ['C++', 'Python', 'MQTT', 'Raspberry Pi', 'InfluxDB', 'Grafana'],
      tags: ['IoT', 'Embedded', 'Sensors', 'Green Campus'],
      status: 'planning',
      timeline: {
        startDate: new Date('2026-09-10'),
        expectedEndDate: new Date('2026-12-01'),
      },
      requirements: {
        skillsNeeded: ['Hardware Prototyping', 'React Dashboard', 'MQTT'],
        rolesNeeded: ['Firmware Developer', 'Frontend Visualizer'],
        isLookingForCollaborators: true,
      },
      visibility: 'public',
      collaborators: [{ userId: student4._id, role: 'Hardware Lead', joinedAt: new Date('2026-09-10') }],
    });

    console.log('[Seed] Seeding Collaboration Requests...');
    // Request 1: student2 requests to join project 1 (LabPulse)
    const collab1 = await Collaboration.create({
      collaborationId: 'COL-1001',
      projectId: project1._id,
      requesterId: student2._id,
      ownerId: student1._id,
      message:
        'Hi Alex, I have strong experience building MongoDB schemas, index tuning, and conflict detection logic. Would love to contribute to the backend routing and stress testing!',
      proposedRole: 'Backend Engineer',
      skills: ['Node.js', 'Express', 'MongoDB', 'Docker'],
      status: 'pending',
      conversation: [
        {
          senderId: student2._id,
          message:
            'Hi Alex, I saw your project needs a Backend Engineer. I have extensive experience in Mongoose index optimization and conflict queries.',
          sentAt: new Date(Date.now() - 4 * 3600 * 1000),
        },
      ],
    });

    // Request 2: student1 accepted request on project 2 (CampusCloud)
    const collab2 = await Collaboration.create({
      collaborationId: 'COL-1002',
      projectId: project2._id,
      requesterId: student1._id,
      ownerId: student2._id,
      message: 'I can design the modern responsive client dashboard for the file vault using React.',
      proposedRole: 'Frontend UI Designer',
      skills: ['React', 'CSS', 'JavaScript'],
      status: 'accepted',
      responseAt: new Date(),
      conversation: [
        {
          senderId: student1._id,
          message: 'Happy to collaborate on the frontend UI and upload dashboard!',
          sentAt: new Date(Date.now() - 24 * 3600 * 1000),
        },
        {
          senderId: student2._id,
          message: 'Welcome aboard Alex! Excited to build the interface with you.',
          sentAt: new Date(Date.now() - 12 * 3600 * 1000),
        },
      ],
    });

    console.log('[Seed] Seeding Notifications...');
    await Notification.create([
      {
        userId: student1._id,
        type: 'collaboration',
        title: 'New Collaboration Request',
        message: 'Priya Sharma requested to join "LabPulse - Smart Laboratory Allocation System" as Backend Engineer.',
        relatedId: collab1.collaborationId,
        isRead: false,
        priority: 'high',
      },
      {
        userId: student1._id,
        type: 'booking',
        title: 'Seat Booking Confirmed',
        message: 'Your booking for Seat PC-01 at Computer Laboratory A is confirmed for today (10:00 - 12:00).',
        relatedId: bkg1.bookingId,
        isRead: true,
        priority: 'medium',
      },
      {
        userId: faculty1._id,
        type: 'booking',
        title: 'Special Booking Review Required',
        message: 'David Miller requested seat PC-03 in Computer Laboratory A with special administrative privileges.',
        relatedId: bkg3.bookingId,
        isRead: false,
        priority: 'high',
      },
      {
        userId: student1._id,
        type: 'system',
        title: 'Scheduled Maintenance Notice',
        message: 'Computer Laboratory A seats PC-14 and PC-28 are currently offline for routine hardware maintenance.',
        isRead: true,
        priority: 'low',
      },
    ]);

    console.log('================================================================');
    console.log(' DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('================================================================');
    console.log('DEMO ACCOUNTS (Password: Password123!)');
    console.log('----------------------------------------------------------------');
    console.log('1. ADMINISTRATOR : admin@example.com    (Role: admin)');
    console.log('2. FACULTY       : faculty@example.com  (Role: faculty)');
    console.log('3. FACULTY 2     : faculty2@example.com (Role: faculty)');
    console.log('4. STUDENT 1     : student@example.com  (Role: student)');
    console.log('5. STUDENT 2     : student2@example.com (Role: student)');
    console.log('6. STUDENT 3     : student3@example.com (Role: student)');
    console.log('----------------------------------------------------------------');
    console.log('LABORATORIES SEEDED:');
    console.log('• LAB-101: Computer Laboratory A (30 seats: Green, Red, Yellow, Gray)');
    console.log('• LAB-102: Advanced AI & Machine Learning Lab (24 seats)');
    console.log('• LAB-103: IoT & Embedded Systems Lab (20 seats)');
    console.log('================================================================');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seedDatabase();
