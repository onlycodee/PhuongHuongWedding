// Cấu hình thiệp cưới — sửa file này, không cần đụng vào index.html hay wedding.js.
window.WEDDING_CONFIG = {
  // Phong cách mặc định: 'hien-dai' | 'sage' | 'navy' | 'rose' | 'truyen-thong'
  theme: 'hien-dai',
  // Hiện dải "Phong cách thiệp" để khách tự đổi màu. Đặt false khi đã chốt một phong cách.
  showThemePicker: true,

  showCountdown: true,
  showGift: true,
  showGuestbook: true,

  // Giờ Lễ thành hôn, dùng cho đồng hồ đếm ngược
  weddingTime: '2026-10-18T11:00:00+07:00',

  // Ảnh cho từng ô. Bỏ ảnh vào assets/photos/ rồi điền đường dẫn; để '' thì hiện khung chờ.
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

  // Link Google Maps của hai địa điểm (nên thay bằng link ghim chính xác)
  maps: {
    'phu-nhieu': 'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent('Nhà văn hoá thôn Phú Nhiêu, Phú Xuyên, Hà Nội'),
    'tuan-hung': 'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent('Thôn Tuấn Hưng, Lai Khê, Hải Phòng')
  },

  // Tài khoản mừng cưới. Để trống account thì hiện "gia đình cập nhật".
  gift: {
    groom: { bank: '', account: '' },
    bride: { bank: '', account: '' }
  },

  // URL nhận phản hồi RSVP (Google Apps Script, Formspree…). Nhận POST dạng form:
  // name, side, events, note, attending. Để '' thì phản hồi chỉ lưu trên máy của khách.
  rsvpEndpoint: ''
};
