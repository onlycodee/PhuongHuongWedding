# PhuongHuongWedding

Thiệp cưới online của **Việt Phương & Ninh Hương** — Lễ thành hôn 18 · 10 · 2026.

Trang tĩnh thuần HTML/CSS/JS, không cần build. Thiết kế gốc: project *Thiep Cuoi* trên claude.ai/design (design system Classical).

## Chạy thử

```bash
npm start        # mở http://localhost:3000
```

Hoặc mở thẳng `index.html` bằng trình duyệt.

## Cấu trúc

| File | Vai trò |
| --- | --- |
| `index.html` | Nội dung thiệp |
| `js/config.js` | **Mọi thứ cần chỉnh**: theme, ảnh, link bản đồ, số tài khoản, nơi nhận RSVP |
| `js/wedding.js` | Đổi theme, đếm ngược, hiệu ứng cuộn, form RSVP, nền cánh hoa |
| `css/classical.css` | Design system Classical (giữ nguyên từ bản thiết kế) |
| `css/wedding.css` | Năm bộ màu và layout của trang |
| `assets/photos/` | Ảnh cưới, mã QR, ảnh bản đồ |

## Việc cần làm trước khi gửi thiệp

1. **Ảnh** — bỏ ảnh vào `assets/photos/` rồi điền đường dẫn vào `photos` trong `js/config.js`. Ô nào chưa có ảnh sẽ hiện khung chờ.
2. **Bản đồ** — thay `maps` bằng link ghim Google Maps chính xác của hai địa điểm.
3. **Mừng cưới** — điền `gift.groom` / `gift.bride` (ngân hàng, số tài khoản) và ảnh QR.
4. **RSVP** — điền `rsvpEndpoint` (Google Apps Script, Formspree…) để nhận phản hồi. Để trống thì phản hồi chỉ lưu trên máy của khách.
5. **Phong cách** — chọn `theme`, rồi đặt `showThemePicker: false` nếu không muốn khách tự đổi màu. Có thể xem nhanh bằng `?theme=navy`.
6. **Sổ lưu bút** — ba lời chúc trong `index.html` là mẫu; thay bằng lời chúc thật hoặc đặt `showGuestbook: false`.
