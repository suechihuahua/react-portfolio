// ─────────────────────────────────────────────────────────────────────────────
// Site content. Each entry in `sections` is one route and one screen of the
// console:
//   • slug    – the path, and what the prompt shows
//   • label   – its name in the sidebar and the command palette
//   • summary – one line, under the heading and in command-palette results
//   • blocks  – the body (see src/components/SectionView.jsx for the kinds:
//               prose, list, timeline, projects)
// ─────────────────────────────────────────────────────────────────────────────

export const person = {
  name: 'Natsuo Fujita',
  handle: 'natsuo',
  role: 'Computer Science · NTU',
  tagline:
    'Computer science student at NTU. I like understanding how systems work — and how they break.',
  location: 'Singapore',
  timezone: 'Asia/Singapore',
  email: 'fujita.natsuo@gmail.com',
  ntuEmail: 'natsuo001@e.ntu.edu.sg',
  github: 'https://github.com/suechihuahua',
  linkedin: 'https://www.linkedin.com/in/natsuo-fujita',
  resume: '/resume.pdf',
}

export const sections = [
  {
    slug: 'about',
    label: 'About',
    summary: 'Who I am and what I keep coming back to.',
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
    summary: 'NTU for computer science, after A-levels at Tampines Meridian.',
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
    slug: 'experience',
    label: 'Experience',
    summary: 'Two years of National Service, and a kitchen before that.',
    blocks: [
      {
        kind: 'timeline',
        items: [
          {
            title: 'Supply Base East',
            subtitle: 'National Serviceman (full-time)',
            period: 'Jul 2023 – Jul 2025',
            points: [
              'In charge of camp passes and clearance',
              'Mastered Microsoft Excel and Outlook for daily operations',
            ],
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
    summary: 'What I have built so far.',
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
            description:
              'A keyboard-driven console built with React and Vite — command palette, fuzzy search, nothing heavier than the router.',
            link: 'https://github.com/suechihuahua/react-portfolio',
          },
        ],
      },
    ],
  },
  {
    slug: 'skills',
    label: 'Skills',
    summary: 'The toolbox: Python, C, C++, Java, and the web on the side.',
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
    summary: 'Basketball, the gym, and a very long anime backlog.',
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
