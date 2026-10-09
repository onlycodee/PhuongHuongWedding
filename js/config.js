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
    'wed-story-bv-1': 'assets/photos/story-bv-1.webp',
    'wed-story-chay-1': 'assets/photos/story-chay-1.webp',
    'wed-story-chay-2': 'assets/photos/story-chay-2.webp',
    'wed-story-chay-3': 'assets/photos/story-chay-3.webp',
    'wed-story-chay-4': 'assets/photos/story-chay-4.webp',
    'wed-story-chay-5': 'assets/photos/story-chay-5.webp',
    'wed-story-chay-6': 'assets/photos/story-chay-6.webp',
    'wed-story-chay-7': 'assets/photos/story-chay-7.webp',
    'wed-story-hg-1': 'assets/photos/story-hg-1.webp',
    'wed-story-hg-2': 'assets/photos/story-hg-2.webp',
    'wed-story-hg-3': 'assets/photos/story-hg-3.webp',
    'wed-story-hg-4': 'assets/photos/story-hg-4.webp',
    'wed-story-hg-5': 'assets/photos/story-hg-5.webp',
    'wed-story-hg-6': 'assets/photos/story-hg-6.webp',
    'wed-story-hg-7': 'assets/photos/story-hg-7.webp',
    'wed-story-hue-1': 'assets/photos/story-hue-1.webp',
    'wed-story-hue-2': 'assets/photos/story-hue-2.webp',
    'wed-story-hue-3': 'assets/photos/story-hue-3.webp',
    'wed-story-nb-1': 'assets/photos/story-nb-1.webp',
    'wed-story-nb-2': 'assets/photos/story-nb-2.webp',
    'wed-story-ql-1': 'assets/photos/story-ql-1.webp',
    'wed-story-ql-2': 'assets/photos/story-ql-2.webp',
    'wed-story-ql-3': 'assets/photos/story-ql-3.webp',
    'wed-story-ql-4': 'assets/photos/story-ql-4.webp',
    'wed-story-sp-1': 'assets/photos/story-sp-1.webp',
    'wed-story-sp-2': 'assets/photos/story-sp-2.webp',
    'wed-story-td-1': 'assets/photos/story-td-1.webp',
    'wed-story-td-2': 'assets/photos/story-td-2.webp',
    'wed-story-td-3': 'assets/photos/story-td-3.webp',
    'wed-story-yt-1': 'assets/photos/story-yt-1.webp',
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
    'wed-qr-groom': 'assets/photos/qr-groom.webp',
    'wed-qr-bride': 'assets/photos/qr-bride.webp'
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
