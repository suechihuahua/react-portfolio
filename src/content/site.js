// ─────────────────────────────────────────────────────────────────────────────
// Site content. Each entry in `sections` is one spot in the room:
//   • spot   – where the camera looks: x/y in % of the room image, zoom factor
//   • avatar – where the pose sprite stands: bottom-centre x/y in %, height in
//              % of the room height
//   • marker – where the pulsing hotspot sits on the object itself (room %)
//   • pose   – which cut-out from public/room/pose-<pose>.png
//   • lines  – what he says in the dialogue box before the card appears
//   • blocks – the card content (see src/components/SectionCard.jsx for kinds:
//              prose, list, timeline, projects)
// ─────────────────────────────────────────────────────────────────────────────

export const person = {
  name: 'Natsuo Fujita',
  tagline: 'Computer science student at NTU. I like understanding how systems work — and how they break.',
  email: 'fujita.natsuo@gmail.com',
  ntuEmail: 'natsuo001@e.ntu.edu.sg',
  github: 'https://github.com/suechihuahua',
  linkedin: 'https://www.linkedin.com/in/natsuo-fujita',
  resume: '/resume.pdf',
}

export const ROOM_IMAGE = { src: '/room/room.jpg', width: 4096, height: 1173 }

// Idle state: sitting at the PC, camera wide on the desk side.
export const home = {
  spot: { x: 60, y: 52, zoom: 1.05 },
  avatar: { x: 62, y: 100, height: 78 },
  pose: 'pc',
}

export const sections = [
  {
    slug: 'about',
    label: 'About me',
    pose: 'about',
    spot: { x: 52, y: 60, zoom: 1.32 },
    avatar: { x: 52, y: 99, height: 70 },
    marker: { x: 62, y: 45 },
    lines: [
      "Hi, I'm Natsuo Fujita.",
      'Computer Science undergraduate at Nanyang Technological University, class of 2029.',
      'I like taking things apart to see how they work — and building things from the ground up.',
      'Have a look around my room.',
    ],
    blocks: [
      {
        kind: 'prose',
        paragraphs: [
          'Singapore-based, currently in my first year of the Bachelor of Computing (Computer Science) at NTU after completing National Service.',
          'Most of what I enjoy comes back to the same question: how does this actually work, and what happens when it doesn’t?',
        ],
      },
      {
        kind: 'list',
        heading: 'Languages',
        groups: [{ name: 'Spoken', items: ['English', 'Chinese', 'Japanese (conversational)'] }],
      },
    ],
  },
  {
    slug: 'education',
    label: 'Education',
    pose: 'education',
    spot: { x: 44, y: 58, zoom: 1.32 },
    avatar: { x: 47, y: 99, height: 70 },
    marker: { x: 44, y: 28 },
    lines: ['This is where the studying happens.', 'NTU for computer science, after A-levels at Tampines Meridian.'],
    blocks: [
      {
        kind: 'timeline',
        items: [
          {
            title: 'Nanyang Technological University, Singapore',
            subtitle: 'Bachelor of Computing (Computer Science)',
            period: 'Aug 2025 – May 2029',
          },
          {
            title: 'Tampines Meridian Junior College',
            subtitle: "GCE 'A' Levels",
            period: 'Jan 2021 – Nov 2022',
          },
        ],
      },
    ],
  },
  {
    slug: 'work',
    label: 'Work experience',
    pose: 'work',
    spot: { x: 71, y: 58, zoom: 1.32 },
    avatar: { x: 74, y: 99, height: 70 },
    marker: { x: 51.5, y: 62 },
    lines: ['Two years of National Service taught me a lot about keeping things running.', 'Before that, I worked the kitchen and the till at Tori-Q.'],
    blocks: [
      {
        kind: 'timeline',
        items: [
          {
            title: 'Supply Base East',
            subtitle: 'National Serviceman (full-time)',
            period: 'Jul 2023 – Jul 2025',
            points: ['In charge of camp passes and clearance', 'Mastered Microsoft Excel and Outlook for daily operations'],
          },
          {
            title: 'Tori-Q',
            subtitle: 'Catering and customer service (part-time)',
            period: 'Jan 2023 – Jun 2023',
            points: [
              'Prepared and cooked food in the kitchen; obtained Food & Hygiene certification',
              'Handled cashiering and customer inquiries',
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'projects',
    label: 'Projects',
    pose: 'pc',
    spot: { x: 68, y: 55, zoom: 1.4 },
    avatar: { x: 62, y: 100, height: 78 },
    marker: { x: 76, y: 38 },
    lines: ['This is where I build things.', 'Latest: a Roblox game with my team for the Garena Hackathon — and this room you are standing in.'],
    blocks: [
      {
        kind: 'projects',
        items: [
          {
            title: 'Garena Hackathon 2026',
            year: 'Feb – Mar 2026',
            description: 'Brainstormed and developed a Roblox game with a team at NTU.',
          },
          {
            title: 'This portfolio',
            year: '2026',
            description: 'An illustrated, interactive room built with React and Vite — every section is a spot in the room.',
            link: 'https://github.com/suechihuahua/react-portfolio',
          },
        ],
      },
    ],
  },
  {
    slug: 'skills',
    label: 'Skills',
    pose: 'skills',
    spot: { x: 55, y: 58, zoom: 1.32 },
    avatar: { x: 54.2, y: 99, height: 70 },
    marker: { x: 56, y: 22 },
    lines: ['The toolbox so far.', 'Python, C, C++ and Java for the most part — Git and the web on the side.'],
    blocks: [
      {
        kind: 'list',
        groups: [
          { name: 'Programming', items: ['Python', 'C', 'C++', 'Java', 'JavaScript', 'HTML'] },
          { name: 'Tools', items: ['Git', 'Microsoft Office', 'React (learning)'] },
          { name: 'Interests', items: ['Cybersecurity', 'Systems programming'] },
        ],
      },
    ],
  },
  {
    slug: 'hobbies',
    label: 'Hobbies',
    pose: 'hobbies',
    spot: { x: 23, y: 62, zoom: 1.5 },
    avatar: { x: 24, y: 99, height: 62 },
    marker: { x: 20, y: 62 },
    lines: ['When the work is done: games, the gym, and a very long anime backlog.', 'I was vice-captain of the basketball team — still play when I can.'],
    blocks: [
      {
        kind: 'list',
        groups: [
          { name: 'Sport', items: ['Basketball (vice-captain)', 'Gym'] },
          { name: 'Screen', items: ['Anime', 'Drama', 'Gaming'] },
          { name: 'Making', items: ['Building projects'] },
        ],
      },
      {
        kind: 'prose',
        heading: 'Basketball vice-captain',
        paragraphs: [
          'Led pre-training routines and on-court preparation, supported teammates, and acted as the bridge between players and the coaching staff.',
        ],
      },
    ],
  },
]

export const sectionBySlug = Object.fromEntries(sections.map((s) => [s.slug, s]))

export const routeOrder = ['/', ...sections.map((s) => `/${s.slug}`)]
