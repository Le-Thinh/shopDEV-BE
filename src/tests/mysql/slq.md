CREATE TABLE test_table(
    id int NOT NULL,
    name varchar(255) NOT NULL,
    age int DEFAULT NULL,
    address varchar(255) DEFAULT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE DEFINER=`thinhle`@`%` PROCEDURE` insert_data()
BEGIN
DECLARE max_id INT DEFAULT 1000000;
DECLARE i INT DEFAULT 1;
WHILE i <= max_id DO
 INSERT INTO test_table(id, name, age, address) VALUES (i, CONCAT('Name', i), i%100, CONCAT('Address', i));
 SET i = i +1;
 END WHILE;
END


<!-- PARTITION DATABASE -->
CREATE TABLE orders(
	order_id INT,
    order_date DATE NOT NULL,
    total_amount DECIMAL(10,2), 
    PRIMARY KEY(order_id, order_date)
)

PARTITION BY RANGE COLUMNS (order_date) (
	PARTITION p0 VALUES LESS THAN ('2022-01-01'),
    PARTITION p2023 VALUES LESS THAN ('2023-01-01'),
    PARTITION p2024 VALUES LESS THAN ('2024-01-01'),
    PARTITION pmax VALUES LESS THAN (MAXVALUE)
)

EXPLAIN SELECT * FROM orders

-- Insert Data
INSERT INTO orders(order_id, order_date, total_amount) VALUES(6, '2025-05-05', 911.11);

-- select data by range
EXPLAIN SELECT * FROM orders PARTITION (p2024);


<!-- PARTITION DATABASE AUTO CREATE NEW TABLE WITH MONTH -->
CREATE DEFINER=`root`@`%` PROCEDURE `create_table_auto_month`()
BEGIN
    -- Dùng để ghi lại tháng tiếp theo dài bao nhiêu
    DECLARE nextMonth varchar(20);
    -- Câu lệnh SQL dùng để ghi lại việc tạo bảng
    DECLARE createTableSQL varchar(5210);
    -- Sau khi thực hiện câu lệnh SQL tạo bảng, lấy số lượng bảng
    DECLARE tableCount int;
    -- Dùng để ghi tên bảng cần tạo
    DECLARE tableName varchar(20);
    -- Tiền tố được sử dụng cho bảng ghi
    DECLARE table_prefix varchar(20);

  -- Lấy ngày của tháng tiếp theo và gán nó cho biến nextMonth
  SELECT SUBSTR(
    replace(
        DATE_ADD(CURDATE(), INTERVAL 1 MONTH),
    '-', ''),
  1, 6) INTO @nextMonth;

  -- Đặt giá trị biến tiền tố bảng thành like this
  set @table_prefix = 'orders_';

  -- Xác định tên bảng = tiền tố bảng + tháng, tức là orders_202310, orders_202311 Định dạng này
  SET @tableName = CONCAT(@table_prefix, @nextMonth);
  -- Xác định câu lệnh SQL để tạo bảng
  set @createTableSQL=concat("create table if not exists ",@tableName,"
	(
		order_id INT, -- id hoá đơn
		order_date DATE NOT NULL,
		total_amount DECIMAL(10, 2),
		PRIMARY KEY (order_id, order_date)
	)");
 
  -- Sử dụng từ khóa PREPARE để tạo phần thân SQL được chuẩn bị sẵn sàng để thực thi
  PREPARE create_stmt from @createTableSQL;
  -- Sử dụng từ khóa EXECUTE để thực thi phần thân SQL đã chuẩn bị ở trên：create_stmt
  EXECUTE create_stmt;
  -- Giải phóng phần thân SQL đã tạo trước đó (giảm mức sử dụng bộ nhớ)
  DEALLOCATE PREPARE create_stmt;

  -- Sau khi thực hiện câu lệnh tạo bảng, hãy truy vấn số lượng bảng và lưu nó vào biến tableCount.
  SELECT
    COUNT(1) INTO @tableCount
  FROM
    information_schema.`TABLES`
  WHERE TABLE_NAME = @tableName;
 
  -- Kiểm tra xem bảng tương ứng đã tồn tại chưa
  SELECT @tableCount 'tableCount';

END


-- Tạo event 
CREATE EVENT 
	`create_table_auto_month_event`
ON SCHEDULE EVERY 
	1 MONTH -- cronjob thực thi mỗi tháng 1 lần
STARTS
	'2025-04-15 16:15:27' -- Bắt đầu thời gian này sẽ start
ON COMPLETION 
	PRESERVE ENABLE -- không xóa bộ count thời gian	khi thực hiện xong
DO
	call create_table_auto_month();