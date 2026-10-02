/* ==========================================================================
   STORY CONTENT — Jagdish Puttu Rao
   Everything a family would want to edit lives here: names, dates, words,
   travel stops and photos.

   Every fact here comes from source/facts.md (the voice note from his
   daughter Pranjali, his LinkedIn education, and what the family wrote).
   Don't add anything that isn't in that file.

   Photos: set any `photo` field to a file in photos/, e.g.
   photo: 'photos/wedding-1995.jpg'. Until then a labelled placeholder shows
   (see PHOTOS.md for the full list of photos the site is waiting for).
   ========================================================================== */

window.STORY = {
  person: {
    first: 'Jagdish',
    middle: 'Puttu',
    last: 'Rao',
    born: 1960,
    eyebrow: 'Peradi · Bombay · Dubai · Bangalore',
    intro: 'Born in 1960, raised in a village in Dakshina Kannada. A life made in Bombay, Dubai and Bangalore, with one dream still ahead.',
    note: 'Photos are placeholders until the family’s pictures arrive.'
  },

  chapters: {
    village: {
      numeral: 'I',
      years: '1960 – 1981',
      title: ['', 'Peradi'],
      place: 'Dakshina Kannada, Karnataka',
      body: 'Jagdish was born in 1960 and grew up in Peradi, a village of areca groves and paddy fields in Dakshina Kannada. He finished school at Jawaharlal Nehru High School in Shirthady with a First, then took a B.Com from Mysore University at SDM College, Ujire, with First Class.',
      skills: ['First Class, school and college', 'Debates & public speaking', 'Sports', 'English · Kannada · Hindi']
    },
    mumbai: {
      numeral: 'II',
      years: '1980s – 2003',
      title: ['', 'Bombay'],
      place: 'Now Mumbai, Maharashtra',
      body: 'He came to Bombay to work and joined the State Bank of India, studying for his M.Com alongside the job. Then came the corporate years: Procter & Gamble, and then Kellogg’s.',
      skills: ['State Bank of India', 'M.Com, Maharashtra University', 'Procter & Gamble', 'Kellogg’s']
    },
    dubai: {
      numeral: 'III',
      years: '2003 – 2017',
      title: ['', 'Dubai'],
      place: 'United Arab Emirates',
      body: 'In 2003 Heinz took him to Dubai. For three years he lived there on his own while the family stayed back in Navi Mumbai. In 2006 they joined him, and Dubai was home until 2017.',
      skills: ['Heinz', 'CMA, Australia · First', 'Three years of long distance']
    },
    world: {
      numeral: 'IV',
      years: '2010 – 2016',
      title: ['The', 'World'],
      place: 'Europe, America, Britain and India',
      body: 'From Dubai the family went exploring: ten countries of Europe in 2010, the United States in 2012, a road trip through Scotland and England in 2015, Delhi and Jaipur that same year, and Munnar and Madurai in 2016.',
      skills: []
    },
    bangalore: {
      numeral: 'V',
      years: '2017 – today',
      title: ['', 'Bangalore'],
      place: 'Bengaluru, Karnataka',
      body: 'He retired in 2017 and came home to Karnataka, to a house in Bangalore that he built himself. Since then, in his daughter’s words, he has been enjoying his life.',
      skills: ['Built his own house', 'Temple Committee Treasurer', 'Portfolio Management Services licence']
    },
    dream: {
      numeral: 'VI',
      years: 'Soon',
      title: ['The', 'Dream'],
      place: 'Farmland of his own',
      body: 'One dream is still ahead: to own farmland and to farm it. The boy who grew up among Peradi’s paddy fields is going back to the land.',
      soon: 'Very soon.',
      skills: []
    }
  },

  /* HUD place names (top right), by chapter */
  places: { village: 'Peradi', mumbai: 'Bombay', dubai: 'Dubai', world: 'The World', bangalore: 'Bangalore', dream: 'The Dream' },

  /* Big moments. Each one opens out of the vehicle like the macOS genie.
     `placeholder` labels the empty photo frame until `photo` is set. */
  milestones: {
    wedding: {
      kicker: 'Milestone · 28 January 1993',
      year: '1993',
      title: 'Jagdish & Pushparatna',
      body: 'On 28 January 1993 he married Pushparatna Priyadarshini of Byndoor. She worked with the State Bank of Mysore and was posted at Huvina Hadagali, the town famous for its jasmine, so their first two years were long-distance. Then she got a transfer to Nariman Point, and by 1995–96 Bombay was home for them both.',
      note: 'Two years apart, then a life together',
      photo: null,
      placeholder: 'Wedding photo',
      tone: 'rose',
      palette: { bg1: '#4a0f1b', bg2: '#7a1f2c', accent: '#e8b965', text: '#f8ecd9' }
    },
    together: {
      kicker: 'Milestone · 2006',
      year: '2006',
      title: 'Together in Dubai',
      body: 'After three years of long distance, Pushparatna and Pranjali moved to Dubai in 2006. They had visited him the year before; this time they came to stay. The family was under one roof again.',
      note: 'Under one roof again',
      photo: null,
      placeholder: 'Family photo in Dubai',
      tone: 'dusk',
      palette: { bg1: '#0a1230', bg2: '#1c2a5e', accent: '#f0c674', text: '#eef0f8' }
    },
    nitk: {
      kicker: 'Milestone · 2014',
      year: '2014',
      title: 'His dream college',
      body: 'NIT Surathkal began as KREC in 1960, the year he was born, and he had watched it grow while he grew up. He really wanted Pranjali to study there. In 2014 she got in.',
      note: 'A dream fulfilled',
      photo: null,
      placeholder: 'Photo at NIT Surathkal',
      tone: 'sage',
      palette: { bg1: '#0c2733', bg2: '#16465a', accent: '#f2c14e', text: '#eef6f8' }
    },
    home: {
      kicker: 'Milestone · 8 May 2017',
      year: '2017',
      title: 'Gruhapravesha',
      body: 'On 8 May 2017 the family celebrated the Gruhapravesha, the house-warming, of the house he built in Bangalore. After Peradi, Bombay and Dubai: a home of his own.',
      note: 'The house he built',
      photo: null,
      placeholder: 'Gruhapravesha photo',
      tone: 'sand',
      palette: { bg1: '#3b2414', bg2: '#6b4224', accent: '#f2c46d', text: '#fbf1e2' }
    },
    temple: {
      kicker: 'Milestone · 2023',
      year: '2023',
      title: 'Treasurer, Temple Committee',
      body: 'He was elected treasurer of the temple committee, quite a recognition in the community. He does it as service to the temple and its people. New to Bangalore, he hardly knew anyone at first; now he is busy, surrounded by people, and has a platform to do something he loves.',
      note: 'Service, and a community',
      photo: null,
      placeholder: 'Temple committee photo',
      tone: 'sand',
      palette: { bg1: '#4a1d0c', bg2: '#8a3b16', accent: '#f7c873', text: '#fdf1df' }
    },
    pranjali: {
      kicker: 'Milestone · 2025',
      year: '2025',
      title: 'Pranjali & Mridul',
      body: 'In 2025 Pranjali married Mridul, and Jagdish welcomed a son-in-law into the family.',
      note: 'Father of the bride',
      photo: null,
      placeholder: 'Wedding photo, 2025',
      tone: 'rose',
      palette: { bg1: '#3a1530', bg2: '#6e2a52', accent: '#f0b8c8', text: '#fbeef3' }
    }
  },

  /* Small moments that pop up as floating notes. */
  events: {
    school: { year: '1973–76', text: 'Jawaharlal Nehru High School, Shirthady · First' },
    sbi: { year: '', text: 'State Bank of India' },
    pg: { year: '', text: 'Procter & Gamble' },
    kelloggs: { year: '', text: 'Kellogg’s' },
    pranjali: { year: '', text: 'A daughter: Pranjali' },
    nerul: { year: '1998', text: 'First home and first car, in Nerul' },
    trolley: { year: '2003–06', text: 'From Dubai he brought Pranjali a maroon trolley bag with a camouflage design. She didn’t like it then, and wishes now she had used it more.' },
    odisha: { year: '2019', text: 'A trip to Odisha to see Pranjali at work' },
    dharamshala: { year: '2022', text: 'Dharamshala and Amritsar, visiting Pranjali' }
  },

  /* Props that slide in like paper keepsakes */
  certificates: {
    bcom: { top: 'Mysore University', title: 'Bachelor of Commerce', grade: 'First Class', meta: ['SDM College, Ujire', '1976 – 1981'], seal: 'B.Com' },
    cma: { top: 'Institute of Certified Management Accountants · Australia', title: 'Certified Management Accountant', grade: 'First', meta: ['Dubai years', '2005'], seal: 'CMA' }
  },
  luggage: { kicker: 'Passenger', name: 'J. P. Rao', extra: 'B.Com, First Class', from: 'Peradi', to: 'Bombay', note: 'One way' },
  apart: {
    a: { place: 'Bombay', who: 'Jagdish' },
    b: { place: 'Huvina Hadagali', who: 'Pushparatna' },
    during: 'Two years, two cities',
    after: 'Then a transfer to Nariman Point'
  },
  departures: { year: '2003', airport: 'Mumbai International' },
  covid: {
    kicker: '2020',
    unit: 'days',
    from: 15,
    to: 30,
    body: 'COVID found him a month before Pranjali’s CAT exam. The rule was fifteen days of isolation. He stayed away for thirty, so that she wouldn’t catch it. She didn’t, and she got into business school.'
  },

  /* Polaroid photo frames that drop in beside the chapters */
  frames: {
    boyhood: { label: 'Jagdish as a boy', photo: null, tone: 'sepia' },
    bombay: { label: 'The Bombay years', photo: null, tone: 'sand' },
    dubai: { label: 'Dubai, 2003', photo: null, tone: 'dusk' },
    portrait: { label: 'Jagdish today', photo: null, tone: 'sage' }
  },

  /* The World chapter. Flights go out from Dubai and come home again.
     A leg with `genie` opens a milestone card instead of a postcard. */
  legs: [
    { to: 'eur', year: 2010, card: { art: 'paris', caption: 'Europe, 2010 · 10 countries', note: 'Ten countries in one family trip.', stamp: 'EUROPE', photo: null } },
    { to: 'usa', year: 2012, card: { art: 'newyork', caption: 'The United States, 2012', note: 'The family’s American trip.', stamp: 'USA', photo: null } },
    { to: 'nitk', year: 2014, genie: 'nitk' },
    { to: 'gbr', year: 2015, card: { art: 'scotland', caption: 'Scotland & England, 2015', note: 'A road trip through Scotland and England.', stamp: 'UK', photo: null } },
    { to: 'del', year: 2015, card: { art: 'jaipur', caption: 'Delhi & Jaipur, 2015', note: 'The capital, and the Pink City.', stamp: 'JAIPUR', photo: null } },
    { to: 'mun', year: 2016, card: { art: 'munnar', caption: 'Munnar & Madurai, 2016', note: 'Tea hills in Munnar, temples in Madurai.', stamp: 'MUNNAR', photo: null } }
  ],

  cities: [
    { id: 'dxb', name: 'Dubai', lat: 25.2, lon: 55.27 },
    { id: 'eur', name: 'Europe', lat: 47.4, lon: 8.5 },
    { id: 'usa', name: 'USA', lat: 40.71, lon: -74.01 },
    { id: 'nitk', name: 'Surathkal', lat: 13.01, lon: 74.79 },
    { id: 'gbr', name: 'Scotland', lat: 56.49, lon: -4.2 },
    { id: 'del', name: 'Jaipur', lat: 26.91, lon: 75.79 },
    { id: 'mun', name: 'Munnar', lat: 10.09, lon: 77.06 }
  ],

  weeks: {
    title: '3,400+',
    sub: 'Each dot is one week of his life so far. The bright ones mark his milestones. The next one will be on the farm.',
    eras: [
      { from: 1960, to: 1980, color: '#7fc08a', label: 'Peradi' },
      { from: 1981, to: 2002, color: '#ecb867', label: 'Bombay' },
      { from: 2003, to: 2016, color: '#9d97f0', label: 'Dubai' },
      { from: 2017, to: 2026, color: '#f39a8f', label: 'Bangalore' }
    ],
    marks: [1960, 1981, 1993, 1998, 2003, 2005, 2006, 2014, 2017, 2020, 2023, 2025]
  },

  finale: {
    kicker: 'Bangalore · 2026',
    title: ['The', 'best', 'is', 'yet', 'to', 'come'],
    stats: [
      { value: 2, label: 'countries called home' },
      { value: 3, label: 'qualifications' },
      { value: 10, label: 'countries in one trip' },
      { value: 1, label: 'dream to go' }
    ],
    line: 'From the paddy fields of Peradi to fields of his own.',
    sign: 'Jagdish Puttu Rao',
    replay: 'Begin again',
    credit: 'Told by his daughter, Pranjali.'
  },

  /* Stops on the road at the bottom of the screen. */
  checkpoints: [
    { id: 'peradi', year: '1960', label: 'Peradi' },
    { id: 'bombay', year: '1980s', label: 'Bombay' },
    { id: 'wedding', year: '1993', label: 'Wedding', milestone: true },
    { id: 'nerul', year: '1998', label: 'Nerul' },
    { id: 'dubai', year: '2003', label: 'Dubai' },
    { id: 'together', year: '2006', label: 'Together', milestone: true },
    { id: 'world', year: '2010', label: 'The World' },
    { id: 'nitk', year: '2014', label: 'NITK', milestone: true },
    { id: 'bangalore', year: '2017', label: 'Bangalore', milestone: true },
    { id: 'temple', year: '2023', label: 'Treasurer', milestone: true },
    { id: 'pranjali', year: '2025', label: 'Pranjali weds', milestone: true },
    { id: 'farm', year: 'Soon', label: 'Farm' }
  ]
};
