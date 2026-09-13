// ─────────────────────────────────────────────────────────────────────────────
// Site content lives here. Every entry in `pages` is one planet, in solar
// order. A page with `sections` renders them in the content card; a page with
// no sections shows the "in development" placeholder. Each page gets:
//   • a link in the HUD nav (by planet name)
//   • a planet in the 3D scene (textured by `planet`)
//   • its own route at /<slug>
//
// Section `kind`s (see src/components/Page.jsx):
//   • "prose"    – one or more paragraphs (default)
//   • "list"     – grouped bullet lists, e.g. skills
//   • "courses"  – a term-by-term course table
//   • "projects" – ruled project entries
// ─────────────────────────────────────────────────────────────────────────────

export const person = {
  name: 'Natsuo Fujita',
  tagline:
    'Computer science student. I like understanding how systems work — and how they break.',
  email: 'fujita.natsuo@gmail.com',
  ntuEmail: 'natsuo001@e.ntu.edu.sg',
  github: 'https://github.com/suechihuahua',
  linkedin: 'https://www.linkedin.com/in/natsuo-fujita',
  resume: '/resume.pdf',
}

export const textureCredit = {
  label: 'Planet textures: Solar System Scope (CC BY 4.0)',
  href: 'https://www.solarsystemscope.com/textures/',
}

export const pages = [
  { slug: 'mercury', planet: 'mercury', planetName: 'Mercury', label: 'Mercury', sections: [] },
  { slug: 'venus', planet: 'venus', planetName: 'Venus', label: 'Venus', sections: [] },
  {
    slug: 'about',
    planet: 'earth',
    planetName: 'Earth',
    label: 'About me',
    blurb: 'who I am',
    sections: [
      {
        kind: 'prose',
        heading: 'Hello',
        paragraphs: [
          "I'm Natsuo, a computer science student drawn to cybersecurity and to building things from the ground up.",
          'Most of what I enjoy comes back to the same question: how does this actually work, and what happens when it doesn’t? Away from a keyboard I train at the gym and keep a long list of dramas and anime.',
        ],
      },
      {
        kind: 'list',
        heading: 'What I work with',
        groups: [
          { name: 'Languages', items: ['Python', 'C++', 'C', 'JavaScript'] },
          { name: 'Learning now', items: ['React', 'Web development'] },
          {
            name: 'Focus areas',
            items: ['Cybersecurity', 'Systems programming', 'How things break'],
          },
        ],
      },
    ],
  },
  {
    slug: 'courses',
    planet: 'mars',
    planetName: 'Mars',
    label: 'Courses taken',
    blurb: 'what I’ve studied',
    sections: [
      {
        kind: 'prose',
        paragraphs: ['Coursework so far, grouped by term. This fills in as I go.'],
      },
      {
        kind: 'courses',
        terms: [
          {
            name: 'Year 1',
            courses: [
              { code: 'CS 101', title: 'Introduction to Programming' },
              { code: 'CS 102', title: 'Data Structures' },
              { code: 'MATH 135', title: 'Discrete Mathematics' },
            ],
          },
          {
            name: 'Year 2',
            courses: [
              { code: 'CS 240', title: 'Algorithms' },
              { code: 'CS 251', title: 'Computer Organization' },
              { code: 'CS 341', title: 'Operating Systems' },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'projects',
    planet: 'jupiter',
    planetName: 'Jupiter',
    label: 'Projects',
    blurb: 'what I’ve built',
    sections: [
      {
        kind: 'projects',
        items: [
          {
            title: 'This portfolio',
            year: '2026',
            description:
              'A small React site, config-driven so new pages and sections are one object each.',
            link: 'https://github.com/suechihuahua/react-portfolio',
          },
          {
            title: 'More soon',
            description:
              'Class projects and security write-ups will land here as they’re ready.',
          },
        ],
      },
    ],
  },
  { slug: 'saturn', planet: 'saturn', planetName: 'Saturn', label: 'Saturn', sections: [] },
  { slug: 'uranus', planet: 'uranus', planetName: 'Uranus', label: 'Uranus', sections: [] },
  { slug: 'neptune', planet: 'neptune', planetName: 'Neptune', label: 'Neptune', sections: [] },
]

export const pageBySlug = Object.fromEntries(pages.map((p) => [p.slug, p]))
