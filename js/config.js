// Site settings — everything the couple needs to edit lives here,
// so index.html and wedding.js never have to be touched.
window.WEDDING_CONFIG = {
  // Default theme: 'hien-dai' | 'sage' | 'navy' | 'rose' | 'truyen-thong'
  theme: 'rose',
  // Shows the theme strip so guests can switch palettes. Set to false once a theme is final.
  showThemePicker: false,

  // Opening curtains + background music (assets/audio/song.mp3). Guests start the song by tapping
  // "Mở thiệp"; the round button in the corner turns it on and off. Set music.src to '' to drop the music.
  intro: true,
  music: { src: 'assets/audio/song.mp3', volume: 0.55 },

  showCountdown: true,
  showGift: true,
  showGuestbook: true,

  // Hidden mini game (js/game.js), found by popping four falling petals or tapping two drifting golden hearts.
  // mode: 'random' (a different one each visit) | 'rush' | 'chase' | 'match' | 'keepup'.
  // lab: true shows the prototype switcher.
  game: { enabled: true, mode: 'random', lab: true },

  // Wedding ceremony time, used by the countdown
  weddingTime: '2026-10-18T11:00:00+07:00',

  // Google Apps Script web app URL (ends with /exec) that stores RSVPs and wishes
  // in a Google Sheet — see backend/README.md. While this is empty the site runs in
  // demo mode: submissions are kept in the visitor's own browser only.
  apiEndpoint: 'https://script.google.com/macros/s/AKfycby3W27cmYuANQmiufo7MlWzFqLrNQ13_rUyVqD54fZZvp6Uyggb8Nx-kPDI5et0rY0U/exec',

  // One-tap wishes offered above every wish box: the chip shows `label`, the box gets `text`
  wishPresets: [
    { label: 'Trăm năm hạnh phúc', text: 'Chúc hai bạn trăm năm hạnh phúc, đầu bạc răng long!' },
    { label: 'Yêu thương trọn đời', text: 'Chúc mừng hạnh phúc! Mong hai bạn luôn yêu thương, nhường nhịn và nắm tay nhau đi hết cuộc đời.' },
    { label: 'Sớm có tin vui', text: 'Chúc cô dâu chú rể sớm có tin vui, gia đình nhỏ luôn đầy ắp tiếng cười.' },
    { label: 'Vững tay chèo', text: 'Mừng ngày chung đôi! Chúc hai bạn mãi vững tay chèo trên mọi chặng đường phía trước.' }
  ],

  // Photo for each slot. Put files in assets/photos/ and set the path; '' keeps the placeholder frame.
  // Tapping a photo opens it large; if a sharper "<name>-full.webp" sits next to it, that copy is shown there.
  photos: {
    'wed-hero': 'assets/photos/hero.webp',
    'wed-groom': 'assets/photos/groom.webp',
    'wed-bride': 'assets/photos/bride.webp',
    'wed-story-1a': 'assets/photos/story-1a.webp',
    'wed-story-1b': 'assets/photos/story-1b.webp',
    'wed-story-2e': 'assets/photos/story-2e.webp',
    'wed-story-2a': 'assets/photos/story-2a.webp',
    'wed-story-2b': 'assets/photos/story-2b.webp',
    'wed-story-2c': 'assets/photos/story-2c.webp',
    'wed-story-2d': 'assets/photos/story-2d.webp',
    'wed-story-3a': 'assets/photos/story-3a.webp',
    'wed-story-3b': 'assets/photos/story-3b.webp',
    'wed-story-3c': 'assets/photos/story-3c.webp',
    'wed-story-3d': 'assets/photos/story-3d.webp',
    'wed-story-4a': 'assets/photos/story-4a.webp',
    'wed-story-4b': 'assets/photos/story-4b.webp',
    'wed-story-5a': 'assets/photos/story-5a.webp',
    'wed-story-5b': 'assets/photos/story-5b.webp',
    'wed-story-6a': 'assets/photos/story-6a.webp',
    'wed-story-6b': 'assets/photos/story-6b.webp',
    'wed-story-6c': 'assets/photos/story-6c.webp',
    'wed-story-7a': 'assets/photos/story-7a.webp',
    'wed-story-7b': 'assets/photos/story-7b.webp',
    'wed-story-7c': 'assets/photos/story-7c.webp',
    'wed-story-7d': 'assets/photos/story-7d.webp',
    'wed-story-8a': 'assets/photos/story-8a.webp',
    'wed-story-8b': 'assets/photos/story-8b.webp',
    'wed-story-9a': 'assets/photos/story-9a.webp',
    'wed-story-9b': 'assets/photos/story-9b.webp',
    'wed-g1': 'assets/photos/album-1.webp',
    'wed-g2': 'assets/photos/album-2.webp',
    'wed-g3': 'assets/photos/album-3.webp',
    'wed-g4': 'assets/photos/album-4.webp',
    'wed-g5': 'assets/photos/album-5.webp',
    'wed-g6': 'assets/photos/album-6.webp',
    'wed-g7': 'assets/photos/album-7.webp',
    'wed-g8': 'assets/photos/album-8.webp',
    'wed-g9': 'assets/photos/album-9.webp',
    'wed-g10': 'assets/photos/album-10.webp',
    'wed-g11': 'assets/photos/album-11.webp',
    'wed-g12': 'assets/photos/album-12.webp',
    'wed-qr-groom': '',
    'wed-qr-bride': ''
  },

  // Where each venue is on the map: the embedded maps in "Chỉ đường" are drawn from these coordinates
  // (the "Mở Google Maps" buttons use the links below)
  mapPoints: {
    'phu-nhieu': { lat: 20.7621251, lng: 105.8864202 },
    'tuan-hung': { lat: 20.976221, lng: 106.451235 }
  },

  // Google Maps links for the two venues (pinned locations)
  maps: {
    // Nhà trai — Nhà văn hoá thôn Phú Nhiêu, Hà Nội
    'phu-nhieu': 'https://maps.app.goo.gl/wuygYBDE575YC3n49',
    // Nhà gái — thôn Tuấn Hưng, Hải Phòng
    'tuan-hung': 'https://maps.app.goo.gl/UqZ5Ab8mKspCNC3k8'
  },

  // Bank accounts for wedding gifts. An empty account keeps the "to be updated" text.
  gift: {
    groom: { bank: '', account: '' },
    bride: { bank: '', account: '' }
  }
};
