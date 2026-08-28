CREATE DATABASE IF NOT EXISTS small_business_manager_shadow;
GRANT ALL PRIVILEGES ON small_business_manager_shadow.* TO 'sbm_user'@'%';
FLUSH PRIVILEGES;
