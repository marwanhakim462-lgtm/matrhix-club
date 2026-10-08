/*
 * MATRIX club: everything you are likely to edit lives in this file.
 * Values marked REPLACE are placeholders. The site works with them,
 * but links and numbers will not reach a real person or folder until you swap them.
 */
window.MATRIX_CONFIG = {
  club: {
    name: 'MATRIX',
    email: 'matrix.club@example.com' // REPLACE: public club inbox
  },

  /*
   * Contact form delivery.
   *  - endpoint: '' -> the form opens the visitor's email app with the message filled in (mailto:).
   *  - endpoint: 'https://formspree.io/f/xxxxxxx' -> the form posts JSON to that service instead.
   */
  form: {
    endpoint: '',
    recipient: 'matrix.club@example.com' // REPLACE: where mailto messages go
  },

  /* Official club Google Drive folder. Opens from the Study Hub banner and from every folder card without its own `drive` link. */
  driveRoot: 'https://drive.google.com/drive/folders/186KTTxTpmV7JM3TuDDq7GVU6Qvn-Vciq',

  /*
   * YouTube channel stats.
   * Browsers cannot read subscriber or view counts from YouTube directly, so there are two modes:
   *  - apiKey set -> the page asks the YouTube Data API v3 for the current numbers (labelled "Live").
   *    Create a key in Google Cloud, enable "YouTube Data API v3", and restrict the key to this
   *    website's address (HTTP referrers). Anything in this file is public, so the restriction matters.
   *  - apiKey empty, or the request fails -> the `snapshot` numbers are shown with their date.
   *    Update the snapshot from the channel's About page now and then.
   */
  youtube: {
    subscribeUrl: 'https://youtube.com/@themathrix',
    channelId: 'UCRvzYUcd-Fm7SScCaC7UHNg',
    apiKey: 'AIzaSyCLqirIka3wBruvuu7QI4kR9ejnw60m8ZI',
    snapshot: { subscribers: 212, views: 6701, asOf: '2026-10-08' }
  },

  socials: [
    {
      id: 'youtube',
      label: 'YouTube',
      handle: '@themathrix',
      blurb: 'Worked examples and short concept videos.',
      cta: 'Watch on YouTube',
      url: 'https://youtube.com/@themathrix'
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      handle: 'The Mathrix Club NCSS',
      blurb: 'Club news and updates from the team.',
      cta: 'Connect on LinkedIn',
      url: 'https://www.linkedin.com/in/the-mathrix-club-ncss-4877b7426/'
    },
    {
      id: 'instagram',
      label: 'Instagram',
      handle: '@themathrixclub',
      blurb: 'Problem of the week, events and behind the scenes.',
      cta: 'Follow on Instagram',
      url: 'https://www.instagram.com/themathrixclub'
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      handle: 'Community group',
      blurb: 'Announcements and quick questions with other members.',
      cta: 'Join the group',
      url: 'https://chat.whatsapp.com/J8ZzUVp8UQrC1eQ2vUs3Za?s=cl&p=a&ilr=1'
    }
  ],

  /* People students should message. `whatsapp` is digits only, with country code and no "+". */
  contacts: [
    {
      name: 'Mohamed Adham',
      role: 'Head President',
      phone: '+20 15 15137637',
      whatsapp: '201515137637',
      message: 'Hi Mohamed, I found you on the MATRIX website and would like to join the club.'
    },
    {
      name: 'Mohamed Anwar',
      role: 'Vice Head President',
      phone: '+20 10 94164045',
      whatsapp: '201094164045',
      message: 'Hi Mohamed, I found you on the MATRIX website and have a question.'
    }
  ],

  /* Leadership. `group` controls the section; `tone` is the avatar colour (cyan, mint or both). */
  /* `bio` and `email` are optional: leave them out and the card simply omits them. */
  team: [
    {
      group: 'Founders',
      role: 'Founder',
      name: 'El-Sayed Waleed',
      phone: '+20 12 25357312',
      whatsapp: '201225357312',
      tone: 'both'
    },
    {
      group: 'Founders',
      role: 'Co-Founder',
      name: 'Siraj Eldeen',
      phone: '+20 10 00448421',
      whatsapp: '201000448421',
      tone: 'both'
    },
    {
      group: 'Presidents',
      role: 'Head President',
      name: 'Mohamed Adham',
      phone: '+20 15 15137637',
      whatsapp: '201515137637',
      tone: 'cyan'
    },
    {
      group: 'Presidents',
      role: 'Vice Head President',
      name: 'Mohamed Anwar',
      phone: '+20 10 94164045',
      whatsapp: '201094164045',
      tone: 'mint'
    }
  ]
};
