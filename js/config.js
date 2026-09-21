// Site settings — everything the couple needs to edit lives here,
// so index.html and wedding.js never have to be touched.
window.WEDDING_CONFIG = {
  // Default theme: 'hien-dai' | 'sage' | 'navy' | 'rose' | 'truyen-thong'
  theme: 'hien-dai',
  // Shows the theme strip so guests can switch palettes. Set to false once a theme is final.
  showThemePicker: true,

  showCountdown: true,
  showGift: true,
  showGuestbook: true,

  // Hidden mini game (js/game.js), found by tapping the drifting golden heart or popping three petals.
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
  photos: {
    'wed-hero': 'assets/photos/wed-hero.webp',
    'wed-groom': '',
    'wed-bride': '',
    'wed-story-1': '',
    'wed-story-2': '',
    'wed-story-3': '',
    'wed-story-4': '',
    'wed-story-5': '',
    'wed-g1': '',
    'wed-g2': '',
    'wed-g3': '',
    'wed-g4': '',
    'wed-g5': '',
    'wed-map-1': '',
    'wed-map-2': '',
    'wed-qr-groom': '',
    'wed-qr-bride': ''
  },

  // Google Maps links for the two venues (replace with exact pinned links)
  maps: {
    'phu-nhieu': 'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent('Nhà văn hoá thôn Phú Nhiêu, Phú Xuyên, Hà Nội'),
    'tuan-hung': 'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent('Thôn Tuấn Hưng, Lai Khê, Hải Phòng')
  },

  // Bank accounts for wedding gifts. An empty account keeps the "to be updated" text.
  gift: {
    groom: { bank: '', account: '' },
    bride: { bank: '', account: '' }
  }
};
