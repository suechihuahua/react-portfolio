// ─────────────────────────────────────────────────────────────────────────────
// Site content lives here. To add a new page + nav button, add one object to
// `pages` below. It automatically gets:
//   • a button in the header nav
//   • an entry in the home-page contents list
//   • its own route at /<slug>
//
// Each page has `sections`. A section's `kind` decides how it renders
// (see src/components/Page.jsx):
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
  github: 'https://github.com/suechihuahua',
  resume: '/resume.pdf',
}

export const pages = [
  {
    slug: 'about',
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
    label: 'Courses taken',
    blurb: 'what I’ve studied',
    sections: [
      {
        kind: 'prose',
        paragraphs: [
          'Coursework so far, grouped by term. This fills in as I go.',
        ],
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
]

export const pageBySlug = Object.fromEntries(pages.map((p) => [p.slug, p]))
