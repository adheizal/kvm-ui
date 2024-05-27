-- Create the sequence Instances table
CREATE SEQUENCE instances_id_seq;

-- Create the table using the sequence for Instances table
CREATE TABLE IF NOT EXISTS public.instances (
   id integer NOT NULL DEFAULT nextval('instances_id_seq'::regclass),
   vm_name text NOT NULL,
   ip_address text NOT NULL,
   ssh_port integer NULL,
   service_ports text NULL,
   os_name text NULL,
   disk_size integer NULL DEFAULT 30,
   PRIMARY KEY (id)
);

-- Create the sequence user table
CREATE SEQUENCE users_id_seq;

-- Create the table using the sequence for user table
CREATE TABLE IF NOT EXISTS public.users (
   id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
   username character varying(50) NOT NULL,
   password character varying(100) NOT NULL,
   PRIMARY KEY (id),
   UNIQUE (username)
);