# Pha phim Việt Nam phát hành bộ phim BASE.
## Đạo diễn, biên kịch, hậu kỳ: Phan Tiến Hưng.
## Nhà sản xuất: Typescript.
## Diễn viên chính: Javascript
## Bộ phim dựa trên những câu truyện có thật:
#### 1. [Vật thể kì bí mang tên DDD](https://viblo.asia/p/domain-driven-design-phan-1-mrDGMOExkzL)
#### 2.Sự kiện Design pattern:
* [Sự tích rợn người về design pattern](https://viblo.asia/p/design-pattern-tai-sao-phai-hoc-design-pattern-ORNZq9OGZ0n)
* Gia tộc database:
  * [Cụ tổ Unit Of Work](https://viblo.asia/p/gioi-thieu-ve-unitofwork-pattern-aWj53p4eK6m)
  * [Ông Entity và bà Repository](https://viblo.asia/p/domain-driven-design-phan-2-MgNeWoZAeYx)
  * [Quản gia DatabaseContext người đến từ xử sở Entity Framework thuộc hành tinh C#]: Entity Framework sử dụng DbContext để kết nối dữ liệu với Database. Nó là trung gian kết nối giữa các Entities sinh ra trong ứng dụng của bạn và Database.
### Hướng dẫn:
#### Lần đầu tiên:
1. Cài đặt docker vào máy
2. Chạy lệnh ```docker pull verdaccio/verdaccio```
3. Chạy lệnh ```docker run -it --rm --name verdaccio -p 4873:4873 verdaccio/verdaccio```
4. Vào thư mục tool trong thư mục base
5. Chạy lệnh ```tool set basePath $1``` ($1 là đường dẫn vật lý tới thư mục base phải là đường dẫn full);
6. Chạy lệnh ```tool set registry http://localhost:4873```
7. Sau đó lần lượt vào các thư mục từ thư mục base để chạy lệnh ```tool build module --name (tên thực mục)``` và lệnh ```tool publish (tên thư mục)``` :
    * utilities
    * interfaces
    * backend/class
    * backend/database
    * backend/api

#### Các lần sau: