/*
 * MATHRIX (The Mathrix Club): everything you are likely to edit lives in this file.
 * Values marked REPLACE are placeholders. The site works with them,
 * but links and numbers will not reach a real person or folder until you swap them.
 */
window.MATHRIX_CONFIG = {
  club: {
    name: 'MATHRIX',
    email: 'mathrix.club@example.com' // REPLACE: public club inbox (only used if form.method is 'email')
  },

  /*
   * "Write to the club" form delivery. Pick one with `method`:
   *  - 'whatsapp' (default): opens WhatsApp with the message written out, addressed to `whatsappTo`.
   *    The visitor presses send. Digits only, with country code and no "+".
   *  - 'email': opens the visitor's email app addressed to `recipient`.
   *  - If `endpoint` is set (for example 'https://formspree.io/f/xxxxxxx') the form posts JSON there instead
   *    and neither of the above is used.
   */
  form: {
    method: 'whatsapp',
    whatsappTo: '201515137637', // Mohamed Adham, Head President. Change to whoever should receive messages.
    endpoint: '',
    recipient: 'mathrix.club@example.com' // REPLACE if you switch method to 'email'
  },

  /* Official club Google Drive folder. Opens from the Study Hub banner, the mind map root and every folder without its own `drive` link. */
  driveRoot: 'https://drive.google.com/drive/folders/186KTTxTpmV7JM3TuDDq7GVU6Qvn-Vciq',

  /*
   * YouTube playlists shown in the Study Hub (strip and mind map), per grade and subject.
   * Add `lo: 'LO1'` (or 'LO2', ...) to any entry to show its Learning Outcome as a badge before the title.
   * To add a playlist, copy a line and paste its link from YouTube.
   */
  playlistsUrl: 'https://www.youtube.com/@themathrix/playlists',
  playlists: [
    { grade: '10', subject: 'math', title: 'Math G10 S1', url: 'https://www.youtube.com/playlist?list=PLbqO2Py1BqB8' },
    { grade: '10', subject: 'mechanics', title: 'Mechanics G10 S1', url: 'https://www.youtube.com/playlist?list=PLa5SDAS5FSNg' },
    { grade: '11', subject: 'math', title: 'Math G11 S1', url: 'https://www.youtube.com/playlist?list=PLenm7VhOODfo' },
    { grade: '11', subject: 'mechanics', title: 'Mechanics G11 S1', url: 'https://www.youtube.com/playlist?list=PLbgcBms6Ua6c' }
  ],

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
      message: 'Hi Mohamed, I found you on the MATHRIX website and would like to join the club.'
    },
    {
      name: 'Mohamed Anwar',
      role: 'Vice Head President',
      phone: '+20 10 94164045',
      whatsapp: '201094164045',
      message: 'Hi Mohamed, I found you on the MATHRIX website and have a question.'
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
