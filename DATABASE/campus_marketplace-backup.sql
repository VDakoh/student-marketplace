--
-- PostgreSQL database dump
--

\restrict j0slbN5E0r9yZilLbBeu3h74zIvaE95kbsuaS8K5GXdNeJxCiUJu2Xm4mvJOEz0

-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.product_images DROP CONSTRAINT IF EXISTS fkqnq71xsohugpqwf3c9gxmsuy;
ALTER TABLE IF EXISTS ONLY public.student DROP CONSTRAINT IF EXISTS student_pkey;
ALTER TABLE IF EXISTS ONLY public.student DROP CONSTRAINT IF EXISTS student_babcock_email_key;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_pkey;
ALTER TABLE IF EXISTS ONLY public.merchant_profiles DROP CONSTRAINT IF EXISTS merchant_profiles_student_id_key;
ALTER TABLE IF EXISTS ONLY public.merchant_profiles DROP CONSTRAINT IF EXISTS merchant_profiles_pkey;
ALTER TABLE IF EXISTS ONLY public.merchant_applications DROP CONSTRAINT IF EXISTS merchant_applications_pkey;
ALTER TABLE IF EXISTS ONLY public.admins DROP CONSTRAINT IF EXISTS admins_pkey;
ALTER TABLE IF EXISTS ONLY public.admins DROP CONSTRAINT IF EXISTS admins_email_key;
ALTER TABLE IF EXISTS public.student ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.merchant_profiles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.merchant_applications ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.admins ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.student_id_seq;
DROP TABLE IF EXISTS public.student;
DROP TABLE IF EXISTS public.products;
DROP TABLE IF EXISTS public.product_images;
DROP SEQUENCE IF EXISTS public.merchant_profiles_id_seq;
DROP TABLE IF EXISTS public.merchant_profiles;
DROP SEQUENCE IF EXISTS public.merchant_applications_id_seq;
DROP TABLE IF EXISTS public.merchant_applications;
DROP SEQUENCE IF EXISTS public.admins_id_seq;
DROP TABLE IF EXISTS public.admins;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    id integer NOT NULL,
    full_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(255) DEFAULT 'ADMIN'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.admins OWNER TO postgres;

--
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admins_id_seq OWNER TO postgres;

--
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;


--
-- Name: merchant_applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.merchant_applications (
    id integer NOT NULL,
    student_id integer NOT NULL,
    business_name character varying(255) NOT NULL,
    whatsapp_number character varying(255) NOT NULL,
    bio text,
    id_card_path character varying(255),
    bea_membership_path character varying(255),
    selfie_image_path character varying(255),
    status character varying(255) DEFAULT 'PENDING'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    main_products character varying(255),
    rejection_reason text,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.merchant_applications OWNER TO postgres;

--
-- Name: merchant_applications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.merchant_applications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.merchant_applications_id_seq OWNER TO postgres;

--
-- Name: merchant_applications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.merchant_applications_id_seq OWNED BY public.merchant_applications.id;


--
-- Name: merchant_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.merchant_profiles (
    id integer NOT NULL,
    student_id integer NOT NULL,
    logo_path character varying(255),
    banner_path character varying(255),
    business_name character varying(255) NOT NULL,
    merchant_name character varying(255) NOT NULL,
    main_products character varying(255),
    tagline character varying(150),
    description text,
    public_phone character varying(255),
    public_email character varying(255),
    instagram_link character varying(255),
    twitter_link character varying(255),
    tiktok_link character varying(255),
    campus character varying(255),
    primary_location character varying(255),
    specific_address character varying(255),
    additional_directions text,
    store_status character varying(255) DEFAULT 'ACTIVE'::character varying,
    business_hours text,
    bank_name character varying(255),
    account_number character varying(255),
    account_name character varying(255),
    return_policy text,
    delivery_methods character varying(255),
    delivery_fee_type character varying(255),
    flat_delivery_fee numeric(38,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.merchant_profiles OWNER TO postgres;

--
-- Name: merchant_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.merchant_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.merchant_profiles_id_seq OWNER TO postgres;

--
-- Name: merchant_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.merchant_profiles_id_seq OWNED BY public.merchant_profiles.id;


--
-- Name: product_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_images (
    product_id integer NOT NULL,
    image_path character varying(255)
);


ALTER TABLE public.product_images OWNER TO postgres;

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id integer NOT NULL,
    category character varying(255) NOT NULL,
    created_at timestamp(6) without time zone,
    custom_category character varying(255),
    description text,
    item_condition character varying(255),
    listing_type character varying(255) NOT NULL,
    merchant_id integer NOT NULL,
    price numeric(38,2) NOT NULL,
    status character varying(255),
    stock_quantity integer,
    sub_type character varying(255) NOT NULL,
    title character varying(255) NOT NULL,
    updated_at timestamp(6) without time zone
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.products ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.products_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: student; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student (
    id integer NOT NULL,
    babcock_email character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(255) DEFAULT 'BUYER'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.student OWNER TO postgres;

--
-- Name: student_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.student_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.student_id_seq OWNER TO postgres;

--
-- Name: student_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.student_id_seq OWNED BY public.student.id;


--
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);


--
-- Name: merchant_applications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.merchant_applications ALTER COLUMN id SET DEFAULT nextval('public.merchant_applications_id_seq'::regclass);


--
-- Name: merchant_profiles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.merchant_profiles ALTER COLUMN id SET DEFAULT nextval('public.merchant_profiles_id_seq'::regclass);


--
-- Name: student id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student ALTER COLUMN id SET DEFAULT nextval('public.student_id_seq'::regclass);


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admins (id, full_name, email, password, role, created_at) FROM stdin;
1	Platform Moderator	moderator@gmail.com	$2a$10$NfiGMjuazM1BBKaDQw3pbu9acfLzyo9RD6YCjtsqf7K7hFokfSXy6	ADMIN	2026-02-24 09:51:07.375752
\.


--
-- Data for Name: merchant_applications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.merchant_applications (id, student_id, business_name, whatsapp_number, bio, id_card_path, bea_membership_path, selfie_image_path, status, created_at, main_products, rejection_reason, updated_at) FROM stdin;
1	7	Charles Tech	123456789	Stuff	uploads/merchant_docs/862437e6-c68b-41e9-9553-6b1d4f7c3fcc_ecommerce-vs-online-marketplace1603983748724190-2.jpg	uploads/merchant_docs/08c0a861-a6b1-401f-8b09-d24eb0646f3d_ecommerce-vs-online-marketplace1603983748724190.jpg	uploads/merchant_docs/7f6f30c3-7768-4c3b-a09b-6190f6045454_Untitled-document-11-e1757344995272-3.jpg	APPROVED	2026-02-23 18:37:32.659063	\N	\N	2026-02-26 11:45:19.449104
9	8	Ferrous Media	0380093923	I offer photoshoot services.	uploads/merchant_docs/8a8791e3-7a1a-452a-92d5-a1c095ea7d4d_AsdrUTb5u7sJcZI1TL1InWWDQe6nB3-metabGFuZGluZyBzaWRlIGltYWdlLnBuZw==-.png	uploads/merchant_docs/9126c305-66f9-4baa-a4b5-f999268585c4_Captain Save-a-Hoe Image Feb 20 2026.png	uploads/merchant_docs/a2c4d44f-33ea-4b00-98b2-c90e99331080_AsdrUTb5u7sJcZI1TL1InWWDQe6nB3-metabGFuZGluZyBzaWRlIGltYWdlLnBuZw==-.png	APPROVED	2026-02-27 04:46:47.030596	Photoshoots	\N	2026-02-27 04:46:53.954961
\.


--
-- Data for Name: merchant_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.merchant_profiles (id, student_id, logo_path, banner_path, business_name, merchant_name, main_products, tagline, description, public_phone, public_email, instagram_link, twitter_link, tiktok_link, campus, primary_location, specific_address, additional_directions, store_status, business_hours, bank_name, account_number, account_name, return_policy, delivery_methods, delivery_fee_type, flat_delivery_fee, created_at, updated_at) FROM stdin;
2	8	uploads/merchant_profiles/ec44e7bf-4d6c-474d-8ee2-02359cdced83_logo.jpg	uploads/merchant_profiles/281dd9a5-935d-4af7-84ea-6a7dcca1130a_banner.jpg	Ferrous Media	Feranmi	Gay	I offer photoshoot services.	I offer photoshoot services.	0380093923									ACTIVE								\N	2026-02-27 04:47:01.247263	2026-02-27 18:56:14.155004
\.


--
-- Data for Name: product_images; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_images (product_id, image_path) FROM stdin;
5	uploads/products/d548f14f-cb88-4e39-a281-ace21c9cb378_product_image_1772307150365.jpeg
5	uploads/products/0196ae35-9f87-4990-8e86-3ef70752624e_product_image_1772307202053.jpeg
5	uploads/products/4aafce80-7a11-4710-b731-8c1877c35979_product_image_1772307215604.jpeg
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, category, created_at, custom_category, description, item_condition, listing_type, merchant_id, price, status, stock_quantity, sub_type, title, updated_at) FROM stdin;
5	Phones & Tablets	2026-02-28 20:34:12.388592	\N	A fairly used iPhone 15 pro max for sale\r\n256GB Space\r\n8GB RAM\r\nBattery Health: 95%	Used - Like New	ITEM	8	850000.00	ACTIVE	3	Electronics & Gadgets	iPhone 15 Pro Max - Used	2026-02-28 20:34:12.388601
\.


--
-- Data for Name: student; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student (id, babcock_email, full_name, password_hash, role, created_at) FROM stdin;
5	arinze@student.babcock.edu.ng	Arinze	$2a$10$xav4x.d7Tn8mm7LfQsQxrephCGSZHRNnhImYIW4wEWxNB18.AZUkS	BUYER	2026-02-23 04:48:18.020286
1	victor.test@student.babcock.edu.ng	Victor	$2a$10$UHtz8SpZJzRcgaNd7TarsODZRReWJQl6mmsgkUSPJ1TqTYbmKnaBK	MERCHANT	2026-02-23 02:47:06.978254
6	test@student.babcock.edu.ng	Test	$2a$10$4uuvcEYr6fGCrspukh3HoO9yz9oq1.tPUfObpb9gpfROeuxUwP5Kq	MERCHANT	2026-02-23 06:00:44.701316
9	test2@student.babcock.edu.ng	Test2	$2a$10$2CD6bEFxPqvN79axalyBUuBdJPg6sk/EB0oWOMGFeJnJ9eLyQijWO	BUYER	2026-02-23 19:12:40.845217
3	derick@student.babcock.edu.ng	Derrick	$2a$10$0cUlPzd8LEARfuamGJtnH.SfW7oJGKPCoPFVbnsMISN7karso9yFe	MERCHANT	2026-02-23 03:45:20.68135
4	henry@student.babcock.edu.ng	Henry	$2a$10$PcGzz0DIB8xExOOl.ywPteyn8WcpeNqtUwTMZ6fs358Fm0TJlvS8a	BUYER	2026-02-23 04:42:33.034423
7	charles@student.babcock.edu.ng	Charles	$2a$10$/rWEUAHe6w3UcrtdHrHvl.q9t/kujzudRM5N9aRn3R3FfNpX3EnbS	BUYER	2026-02-23 06:41:19.123201
8	feranmi@student.babcock.edu.ng	Feranmi	$2a$10$Tkr8rf4SEkyHYcbBYcln/.VAw1ygbOU5eLpYnW6pG8x8yEqnbT8Fq	MERCHANT	2026-02-23 12:18:59.284603
10	ebube@student.babcock.edu.ng	Ebube	$2a$10$RfJLUQVKBB0.EDbgoydKR.tW2.cwovdjmWQ6LujvVEiYlM0SlNKJG	BUYER	2026-02-27 06:52:11.172762
\.


--
-- Name: admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admins_id_seq', 1, true);


--
-- Name: merchant_applications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.merchant_applications_id_seq', 9, true);


--
-- Name: merchant_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.merchant_profiles_id_seq', 2, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 5, true);


--
-- Name: student_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_id_seq', 10, true);


--
-- Name: admins admins_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_email_key UNIQUE (email);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: merchant_applications merchant_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.merchant_applications
    ADD CONSTRAINT merchant_applications_pkey PRIMARY KEY (id);


--
-- Name: merchant_profiles merchant_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.merchant_profiles
    ADD CONSTRAINT merchant_profiles_pkey PRIMARY KEY (id);


--
-- Name: merchant_profiles merchant_profiles_student_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.merchant_profiles
    ADD CONSTRAINT merchant_profiles_student_id_key UNIQUE (student_id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: student student_babcock_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student
    ADD CONSTRAINT student_babcock_email_key UNIQUE (babcock_email);


--
-- Name: student student_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student
    ADD CONSTRAINT student_pkey PRIMARY KEY (id);


--
-- Name: product_images fkqnq71xsohugpqwf3c9gxmsuy; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT fkqnq71xsohugpqwf3c9gxmsuy FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- PostgreSQL database dump complete
--

\unrestrict j0slbN5E0r9yZilLbBeu3h74zIvaE95kbsuaS8K5GXdNeJxCiUJu2Xm4mvJOEz0

