create table user(
    id int primary key AUTO_INCREMENT,
    name varchar(250),
    email varchar(50),
    password varchar(250),
    role varchar(20),
    UNIQUE (email)
);


    insert into user(name,email,password,role) values("Admin","admin@gmail.com",'admin','admin');
email
create table category(
    id int NOT NULL AUTO_INCREMENT,
    name varchar(255) NOT NULL,
    primary key(id)
);

create table exercise(
    id int NOT NULL AUTO_INCREMENT,
    name varchar(255) NOT NULL,
    categoryId integer NOT NULL,
    description varchar(255),
    videoUrl varchar(20),
    status varchar(20),
    primary key(id)
);

create table plan(
    id int NOT NULL AUTO_INCREMENT,
    uuid varchar(200) NOT NULL,
    name varchar(255) NOT NULL,
    squat double NOT NULL,
    benchpress double NOT NULL,
    deadlift double NOT NULL,
    exerciseInfo JSON DEFAULT NULL,
    primary key(id)

);